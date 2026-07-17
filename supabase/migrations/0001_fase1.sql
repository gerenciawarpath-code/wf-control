-- =============================================================
-- WF Control — Fase 1
-- Todo el dinero se guarda en pesos colombianos enteros (bigint).
-- La caja NO es una tabla: es la suma de los abonos.
-- =============================================================

-- 1. Socios (uno por cada cuenta del login)
create table public.socios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- Al crear una cuenta en el login, se crea su ficha de socio automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.socios (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 2. Clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  created_at timestamptz not null default now()
);

-- 3. Productos
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  costo bigint not null check (costo >= 0),
  precio_venta bigint not null check (precio_venta >= 0),
  duracion_dias integer not null check (duracion_dias > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Pedidos
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  tomado_por uuid not null references public.socios (id),
  fecha date not null default current_date,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'despachado', 'entregado')),
  tipo text not null check (tipo in ('contado', 'credito')),
  created_at timestamptz not null default now()
);

-- 5. Renglones de pedido
-- precio_venta y costo se congelan al registrar: cambios futuros del
-- producto no alteran pedidos ya hechos.
create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad integer not null check (cantidad > 0),
  precio_venta bigint not null check (precio_venta >= 0),
  costo bigint not null check (costo >= 0)
);

-- 6. Cuotas (solo pedidos a crédito). El estado no se guarda: se calcula.
create table public.cuotas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  numero integer not null check (numero > 0),
  fecha date not null,
  monto bigint not null check (monto > 0),
  unique (pedido_id, numero)
);

-- 7. Abonos
create table public.abonos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  monto bigint not null check (monto > 0),
  medio text not null check (medio in ('bancolombia', 'nequi', 'efectivo')),
  fecha date not null default current_date,
  registrado_por uuid not null references public.socios (id),
  comprobante_path text,
  created_at timestamptz not null default now()
);

create index abonos_pedido_idx on public.abonos (pedido_id);
create index cuotas_pedido_idx on public.cuotas (pedido_id);
create index pedido_items_pedido_idx on public.pedido_items (pedido_id);
create index pedidos_cliente_idx on public.pedidos (cliente_id);

-- =============================================================
-- Vistas: las reglas del dinero viven aquí, en un solo lugar.
-- Caja = Reponer + Ganancia repartible se cumple por construcción.
-- =============================================================

-- Totales por pedido
create view public.pedido_totales
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
  greatest(coalesce(a.recaudado, 0) - coalesce(i.costo_total, 0), 0) as ganancia_realizada
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

-- Cuotas con su estado calculado: lo recaudado del pedido se reparte
-- contra las cuotas de la más antigua a la más nueva.
create view public.cuotas_detalle
with (security_invoker = true) as
with acumulado as (
  select
    c.*,
    sum(c.monto) over (
      partition by c.pedido_id
      order by c.fecha, c.numero
      rows between unbounded preceding and current row
    ) as monto_acumulado,
    pt.recaudado
  from public.cuotas c
  join public.pedido_totales pt on pt.pedido_id = c.pedido_id
)
select
  id, pedido_id, numero, fecha, monto,
  least(greatest(recaudado - (monto_acumulado - monto), 0), monto) as pagado,
  case
    when least(greatest(recaudado - (monto_acumulado - monto), 0), monto) >= monto
      then 'pagada'
    when fecha < current_date then 'vencida'
    when least(greatest(recaudado - (monto_acumulado - monto), 0), monto) > 0
      then 'parcial'
    else 'pendiente'
  end as estado
from acumulado;

-- Resumen general: la fila única que alimenta la pantalla de Inicio
create view public.resumen_general
with (security_invoker = true) as
select
  coalesce(sum(recaudado), 0) as caja,
  coalesce(sum(ganancia_realizada), 0) as ganancia_repartible,
  coalesce(sum(costo_recuperado), 0) as reponer,
  coalesce(sum(saldo) filter (where tipo = 'credito'), 0) as te_deben,
  count(*) filter (where tipo = 'credito' and saldo > 0) as pedidos_con_deuda,
  count(*) filter (where estado = 'pendiente') as pedidos_pendientes
from public.pedido_totales;

-- Caja desglosada por medio de pago
create view public.caja_por_medio
with (security_invoker = true) as
select medio, sum(monto) as total
from public.abonos
group by medio;

-- Clientes con sus cifras calculadas (nada se escribe a mano)
create view public.clientes_detalle
with (security_invoker = true) as
select
  c.id,
  c.nombre,
  c.telefono,
  c.created_at,
  coalesce(sum(pt.valor_total), 0) as total_comprado,
  coalesce(sum(pt.saldo) filter (where pt.tipo = 'credito'), 0) as deuda,
  count(pt.pedido_id) as num_pedidos,
  -- Fecha estimada en que se le acaba el último producto:
  -- fecha del último pedido + duración del producto × cantidad
  (
    select max(p2.fecha + (pi.cantidad * pr.duracion_dias))
    from public.pedidos p2
    join public.pedido_items pi on pi.pedido_id = p2.id
    join public.productos pr on pr.id = pi.producto_id
    where p2.cliente_id = c.id
      and p2.fecha = (
        select max(p3.fecha) from public.pedidos p3 where p3.cliente_id = c.id
      )
  ) as fecha_recompra
from public.clientes c
left join public.pedido_totales pt on pt.cliente_id = c.id
group by c.id;

-- =============================================================
-- Seguridad: solo los tres socios (usuarios logueados) ven y tocan.
-- El registro de cuentas nuevas se cierra desde la configuración.
-- =============================================================

alter table public.socios enable row level security;
alter table public.clientes enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.cuotas enable row level security;
alter table public.abonos enable row level security;

create policy "socios acceso total" on public.socios
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.clientes
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.productos
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.pedidos
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.pedido_items
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.cuotas
  for all to authenticated using (true) with check (true);
create policy "socios acceso total" on public.abonos
  for all to authenticated using (true) with check (true);

-- =============================================================
-- Comprobantes: bucket privado, solo socios logueados.
-- =============================================================

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "socios ven comprobantes" on storage.objects
  for select to authenticated using (bucket_id = 'comprobantes');
create policy "socios suben comprobantes" on storage.objects
  for insert to authenticated with check (bucket_id = 'comprobantes');
