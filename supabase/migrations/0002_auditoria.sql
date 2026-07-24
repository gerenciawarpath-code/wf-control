-- =============================================================
-- WF Control — Auditoría (trazabilidad de ediciones y borrados)
-- Cada UPDATE y DELETE en las tablas de datos deja registro de
-- quién lo hizo, cuándo, y el estado ANTERIOR del registro.
-- El log lo escribe un trigger, así que no se puede saltar desde
-- la app ni manipular: los socios solo pueden LEERLO.
-- =============================================================

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  accion text not null check (accion in ('editar', 'eliminar')),
  socio_id uuid references public.socios (id),
  fecha timestamptz not null default now(),
  datos_anteriores jsonb
);

create index if not exists auditoria_fecha_idx on public.auditoria (fecha desc);

alter table public.auditoria enable row level security;

-- Solo lectura para los socios; nadie puede insertar/editar/borrar el log
-- (las inserciones las hace el trigger con security definer).
drop policy if exists "socios ven auditoria" on public.auditoria;
create policy "socios ven auditoria" on public.auditoria
  for select to authenticated using (true);

-- Función de auditoría: captura el actor (auth.uid) y el OLD como jsonb.
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'UPDATE' then
    insert into public.auditoria (tabla, registro_id, accion, socio_id, datos_anteriores)
    values (tg_table_name, old.id, 'editar', actor, to_jsonb(old));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.auditoria (tabla, registro_id, accion, socio_id, datos_anteriores)
    values (tg_table_name, old.id, 'eliminar', actor, to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

-- Attach a cada tabla de datos.
do $$
declare
  t text;
begin
  foreach t in array array['clientes', 'productos', 'pedidos', 'pedido_items', 'cuotas', 'abonos']
  loop
    execute format('drop trigger if exists auditar on public.%I', t);
    execute format(
      'create trigger auditar after update or delete on public.%I
         for each row execute function public.registrar_auditoria()',
      t
    );
  end loop;
end $$;

-- Vista con el nombre del socio, para pintar el historial sin joins en la app.
create or replace view public.auditoria_detalle
with (security_invoker = true) as
select
  a.id,
  a.tabla,
  a.registro_id,
  a.accion,
  a.fecha,
  a.datos_anteriores,
  s.nombre as socio_nombre
from public.auditoria a
left join public.socios s on s.id = a.socio_id
order by a.fecha desc;
