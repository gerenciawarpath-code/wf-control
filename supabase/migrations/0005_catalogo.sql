-- =====================================================================
-- WF Control — 0005 Catálogo web (respaldo versionado del esquema)
--
-- Este archivo REFLEJA el esquema del catálogo que YA está aplicado en
-- Supabase (tablas marcas y catalogo_fichas, columnas nuevas de productos,
-- y las vistas públicas catalogo_publico / catalogo_marcas). Se guarda en
-- el repo solo para tener respaldo y control de versiones.
--
-- Es idempotente ("if not exists" / "create or replace view"): volver a
-- ejecutarlo NO borra ni cambia datos existentes, ni toca costos, precios
-- ni la lógica financiera de WF Control.
-- =====================================================================

-- 1) MARCAS ------------------------------------------------------------
create table if not exists public.marcas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text not null unique,
  pais        text,
  logo_url    text,
  descripcion text,                      -- por qué la elegimos / info pública
  orden       integer not null default 100,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) FICHAS: la "página" de producto del catálogo ----------------------
--    Agrupa uno o varios tamaños (que viven en public.productos).
create table if not exists public.catalogo_fichas (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  nombre         text not null,
  marca_id       uuid references public.marcas(id) on delete set null,
  tipo           text not null,          -- proteinas, creatina, pre-entreno, aminoacidos, vitaminas, quemadores, salud, accesorios
  objetivos      text[] not null default '{}',   -- masa, definicion, energia, recuperacion, salud
  resumen        text,
  descripcion    text,
  para_quien     text,
  contiene       text[] not null default '{}',
  uso            text,
  por_que        text,
  consideraciones text[] not null default '{}',
  sabores        text[] not null default '{}',   -- lista de sabores (no cambian el precio)
  estimulante    boolean not null default false,
  etiqueta       text,                   -- mas-vendido | recomendado | esencial | (vacío)
  nuevo          boolean not null default false,
  destacado      boolean not null default false,
  foto_url       text,
  fotos          text[] not null default '{}',
  orden          integer not null default 100,
  visible        boolean not null default false, -- oculto hasta completar su información
  created_at     timestamptz not null default now()
);

-- 3) Vincular cada producto (tamaño/SKU) a una ficha -------------------
--    Columnas NUEVAS y opcionales. No se toca costo/precio_venta.
alter table public.productos add column if not exists ficha_id         uuid references public.catalogo_fichas(id) on delete set null;
alter table public.productos add column if not exists tamano           text;        -- presentación: "5 lb", "300 g", "30 serv"
alter table public.productos add column if not exists precio_anterior  bigint;      -- solo para "En descuento" real
alter table public.productos add column if not exists visible_catalogo boolean not null default true;

create index if not exists idx_productos_ficha on public.productos(ficha_id);
create index if not exists idx_fichas_marca on public.catalogo_fichas(marca_id);

-- 4) Bloqueo (RLS): socios editan; el público NO toca estas tablas -----
alter table public.marcas          enable row level security;
alter table public.catalogo_fichas enable row level security;

drop policy if exists "socios acceso total" on public.marcas;
create policy "socios acceso total" on public.marcas
  for all to authenticated using (true) with check (true);

drop policy if exists "socios acceso total" on public.catalogo_fichas;
create policy "socios acceso total" on public.catalogo_fichas
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.marcas          to authenticated;
grant select, insert, update, delete on public.catalogo_fichas to authenticated;

-- 5) VISTAS PÚBLICAS (lo único que el catálogo web puede leer) ---------
--    Se ejecutan como dueño (postgres) y exponen SOLO columnas seguras.
--    NUNCA incluyen costo, cantidades ni datos internos.
create or replace view public.catalogo_publico
with (security_invoker = false) as
select
  f.id, f.slug, f.nombre,
  m.nombre as marca, m.slug as marca_slug,
  f.tipo, f.objetivos, f.resumen, f.descripcion, f.para_quien,
  f.contiene, f.uso, f.por_que, f.consideraciones, f.sabores,
  f.estimulante, f.etiqueta, f.nuevo, f.destacado,
  f.foto_url, f.fotos, f.orden,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', p.id, 'tamano', p.tamano,
             'precio', p.precio_venta, 'precio_anterior', p.precio_anterior,
             'disponible', p.activo
           ) order by p.precio_venta)
    from public.productos p
    where p.ficha_id = f.id and p.visible_catalogo = true
  ), '[]'::jsonb) as presentaciones
from public.catalogo_fichas f
left join public.marcas m on m.id = f.marca_id
where f.visible = true;

create or replace view public.catalogo_marcas
with (security_invoker = false) as
select m.id, m.nombre, m.slug, m.pais, m.logo_url, m.descripcion, m.orden,
  (select count(*) from public.catalogo_fichas f
     where f.marca_id = m.id and f.visible = true) as num_fichas
from public.marcas m
where m.visible = true
order by m.orden, m.nombre;

-- 6) Cerrar el acceso directo del público a las tablas -----------------
--    y dejarle SOLO lectura de las dos vistas del catálogo.
revoke all on all tables in schema public from anon;
grant select on public.catalogo_publico to anon;
grant select on public.catalogo_marcas  to anon;

-- Fin.
