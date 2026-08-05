-- =============================================================
-- WF Control — Módulo de compras a proveedores + fotos + ajuste
-- Nuevo modelo financiero:
--   Caja               = Σabonos − Σcompras
--   Ganancia repartible = Σ max(0, recaudado − costo_total)   (igual)
--   Reponer            = Σ min(recaudado, costo_total) − Σcompras
--   ⇒ Caja = Reponer + Ganancia repartible  (se cumple por construcción)
-- Todo en pesos enteros (bigint).
-- =============================================================

-- 1. Proveedores
create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.proveedores (nombre)
select 'Proveedor principal'
where not exists (select 1 from public.proveedores where nombre = 'Proveedor principal');

-- 2. Compras (salidas de caja)
create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id),
  fecha date not null default current_date,
  medio text not null check (medio in ('bancolombia', 'nequi', 'efectivo')),
  comprobante_url text,
  pedido_id uuid references public.pedidos (id) on delete set null,
  registrado_por uuid references public.socios (id),
  nota text,
  es_ajuste boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Renglones de compra (producto_id nullable para el ajuste histórico)
create table if not exists public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  producto_id uuid references public.productos (id),
  cantidad integer not null check (cantidad > 0),
  costo_unitario bigint not null check (costo_unitario >= 0),
  costo_total bigint generated always as (cantidad * costo_unitario) stored
);

create index if not exists compras_proveedor_idx on public.compras (proveedor_id);
create index if not exists compras_pedido_idx on public.compras (pedido_id);
create index if not exists compra_items_compra_idx on public.compra_items (compra_id);

-- 4. Foto en productos
alter table public.productos add column if not exists foto_url text;

-- =============================================================
-- Seguridad (solo socios logueados)
-- =============================================================
alter table public.proveedores enable row level security;
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;

drop policy if exists "socios acceso total" on public.proveedores;
drop policy if exists "socios acceso total" on public.compras;
drop policy if exists "socios acceso total" on public.compra_items;
create policy "socios acceso total" on public.proveedores
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.compras
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.compra_items
  for all to authenticated using (true) with check (true);

-- =============================================================
-- Vistas
-- =============================================================

-- Totales por compra
create or replace view public.compra_totales
with (security_invoker = true) as
select
  c.id as compra_id,
  c.proveedor_id,
  c.fecha,
  c.medio,
  c.pedido_id,
  c.es_ajuste,
  coalesce(sum(ci.costo_total), 0) as total
from public.compras c
left join public.compra_items ci on ci.compra_id = c.id
group by c.id;

-- pedido_totales: se agrega la columna tiene_compra AL FINAL (no rompe consumidores)
create or replace view public.pedido_totales
with (security_invoker = true) as
select
  p.id as pedido_id,
  p.cliente_id,
  p.tomado_por,
  p.fecha,
  p.estado,
  p.tipo,
  coalesce(i.valor_total, 0) as valor_total,
  coalesce(i.costo_total, 0) as costo_total,
  coalesce(a.recaudado, 0) as recaudado,
  greatest(coalesce(i.valor_total, 0) - coalesce(a.recaudado, 0), 0) as saldo,
  least(coalesce(a.recaudado, 0), coalesce(i.costo_total, 0)) as costo_recuperado,
  greatest(coalesce(a.recaudado, 0) - coalesce(i.costo_total, 0), 0) as ganancia_realizada,
  exists (select 1 from public.compras co where co.pedido_id = p.id) as tiene_compra
from public.pedidos p
left join (
  select pedido_id,
         sum(cantidad * precio_venta) as valor_total,
         sum(cantidad * costo) as costo_total
  from public.pedido_items
  group by pedido_id
) i on i.pedido_id = p.id
left join (
  select pedido_id, sum(monto) as recaudado
  from public.abonos
  group by pedido_id
) a on a.pedido_id = p.id;

-- Caja por medio: ahora con entradas (abonos), salidas (compras) y neto
drop view if exists public.caja_por_medio;
create view public.caja_por_medio
with (security_invoker = true) as
select
  m.medio,
  coalesce((select sum(monto) from public.abonos a where a.medio = m.medio), 0) as entradas,
  coalesce((select sum(ct.total) from public.compra_totales ct where ct.medio = m.medio), 0) as salidas,
  coalesce((select sum(monto) from public.abonos a where a.medio = m.medio), 0)
    - coalesce((select sum(ct.total) from public.compra_totales ct where ct.medio = m.medio), 0) as neto
from (values ('bancolombia'), ('nequi'), ('efectivo')) as m (medio);

-- Resumen general (dashboard)
drop view if exists public.resumen_general;
create view public.resumen_general
with (security_invoker = true) as
select
  (select coalesce(sum(monto), 0) from public.abonos)
    - (select coalesce(sum(total), 0) from public.compra_totales) as caja,
  coalesce(sum(pt.ganancia_realizada), 0) as ganancia_repartible,
  coalesce(sum(pt.costo_recuperado), 0)
    - (select coalesce(sum(total), 0) from public.compra_totales) as reponer,
  coalesce(sum(pt.saldo) filter (where pt.tipo = 'credito'), 0) as te_deben,
  count(*) filter (where pt.tipo = 'credito' and pt.saldo > 0) as pedidos_con_deuda,
  count(*) filter (where pt.estado = 'pendiente') as pedidos_pendientes,
  (select coalesce(sum(total), 0) from public.compra_totales) as compras_total,
  coalesce(sum(pt.costo_total) filter (where not pt.tiene_compra), 0) as comprometido_comprar,
  count(*) filter (where not pt.tiene_compra and pt.valor_total > 0) as pedidos_sin_compra
from public.pedido_totales pt;

-- =============================================================
-- Auditoría: sumar las tablas nuevas
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array['proveedores', 'compras', 'compra_items']
  loop
    execute format('drop trigger if exists auditar on public.%I', t);
    execute format(
      'create trigger auditar after update or delete on public.%I
         for each row execute function public.registrar_auditoria()',
      t
    );
  end loop;
end $$;

-- =============================================================
-- Storage: bucket público para fotos de productos
-- =============================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "productos lectura publica" on storage.objects;
drop policy if exists "socios suben fotos productos" on storage.objects;
create policy "productos lectura publica" on storage.objects
  for select using (bucket_id = 'productos');
create policy "socios suben fotos productos" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos');

-- =============================================================
-- Ajuste inicial de caja (una sola vez, idempotente)
-- Lleva la caja de $776.100 a $207.500 registrando $568.600 de
-- compras históricas anteriores al módulo.
-- =============================================================
do $$
declare
  prov_id  uuid;
  compra_id uuid;
begin
  if not exists (select 1 from public.compras where es_ajuste) then
    insert into public.proveedores (nombre)
    select 'Ajuste histórico'
    where not exists (select 1 from public.proveedores where nombre = 'Ajuste histórico');

    select id into prov_id from public.proveedores where nombre = 'Ajuste histórico' limit 1;

    insert into public.compras (proveedor_id, fecha, medio, es_ajuste, nota)
    values (
      prov_id,
      current_date,
      'efectivo',
      true,
      'Ajuste inicial — compras históricas anteriores al módulo de compras'
    )
    returning id into compra_id;

    insert into public.compra_items (compra_id, producto_id, cantidad, costo_unitario)
    values (compra_id, null, 1, 568600);
  end if;
end $$;
