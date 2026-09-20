-- =============================================================
-- WF Control — 0004 Correcciones financieras (producción)
--
-- Arregla tres inconsistencias del dashboard SIN mover la caja
-- (la caja real de $126.100 ya refleja el dinero que hay hoy):
--
--   1. 15 pedidos comprados en la vida real pero nunca registrados
--      → marcarlos como comprados sin descontar caja.
--   2. Ganancia repartible mentía ($467.600 con caja de $126.100)
--      → topar la ganancia a la caja disponible.
--   3. Efectivo en negativo por el ajuste histórico de $568.600
--      cargado 100% a 'efectivo' → repartirlo por medio en
--      proporción a las entradas reales de cada uno.
--
-- Invariante que se mantiene: Caja = Reponer + Ganancia repartible.
-- Todo en pesos enteros (bigint).
-- =============================================================

-- =============================================================
-- Corrección 1 — Compra registrada por fuera del sistema
-- =============================================================

alter table public.pedidos
  add column if not exists compra_registrada_externamente boolean not null default false;

-- pedido_totales: tiene_compra ahora también es true si un socio
-- compró el producto en la realidad pero no lo cargó en Compras.
-- (mismas columnas/tipos que 0003 → create or replace válido)
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
  (
    exists (select 1 from public.compras co where co.pedido_id = p.id)
    or p.compra_registrada_externamente
  ) as tiene_compra
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

-- Marcar como comprados-por-fuera los pedidos que hoy no tienen
-- ninguna compra asociada. No toca la caja: solo apaga el
-- "comprometido para comprar". El guard evita re-marcar (ruido de auditoría).
update public.pedidos p
set compra_registrada_externamente = true
where compra_registrada_externamente = false
  and not exists (select 1 from public.compras co where co.pedido_id = p.id);

-- =============================================================
-- Corrección 2 — Ganancia repartible nunca mayor que la caja
-- =============================================================
--   ganancia_calculada  = Σ max(0, recaudado − costo_total)   (lo de antes)
--   ganancia_repartible = greatest(0, least(ganancia_calculada, caja))
--   reponer             = caja − ganancia_repartible          (nunca negativo)
--   ⇒ Caja = Reponer + Ganancia repartible  (por construcción)
-- Se conservan exactamente las mismas columnas que en 0003.
drop view if exists public.resumen_general;
create view public.resumen_general
with (security_invoker = true) as
with base as (
  select
    (select coalesce(sum(monto), 0) from public.abonos)               as abonos_total,
    (select coalesce(sum(total), 0) from public.compra_totales)       as compras_total,
    coalesce(sum(pt.ganancia_realizada), 0)                           as ganancia_calculada,
    coalesce(sum(pt.saldo) filter (where pt.tipo = 'credito'), 0)     as te_deben,
    count(*) filter (where pt.tipo = 'credito' and pt.saldo > 0)      as pedidos_con_deuda,
    count(*) filter (where pt.estado = 'pendiente')                   as pedidos_pendientes,
    coalesce(sum(pt.costo_total) filter (where not pt.tiene_compra), 0) as comprometido_comprar,
    count(*) filter (where not pt.tiene_compra and pt.valor_total > 0)  as pedidos_sin_compra
  from public.pedido_totales pt
)
select
  (abonos_total - compras_total) as caja,
  greatest(0, least(ganancia_calculada, abonos_total - compras_total)) as ganancia_repartible,
  (abonos_total - compras_total)
    - greatest(0, least(ganancia_calculada, abonos_total - compras_total)) as reponer,
  te_deben,
  pedidos_con_deuda,
  pedidos_pendientes,
  compras_total,
  comprometido_comprar,
  pedidos_sin_compra
from base;

-- =============================================================
-- Corrección 3 — Repartir el ajuste histórico por medio
-- =============================================================
-- El ajuste ($568.600, es_ajuste = true) estaba 100% en 'efectivo',
-- que solo tuvo $118.600 de entradas → efectivo quedaba en negativo.
-- Se borra el ajuste único y se recrea como una compra-ajuste por
-- medio, repartida en proporción a las entradas reales (abonos) de
-- cada medio. El total repartido es idéntico ⇒ la caja no cambia.
do $$
declare
  prov_id       uuid;
  fecha_aj      date;
  reg_por       uuid;
  total_ajuste  bigint;
  e_banco       bigint;
  e_nequi       bigint;
  e_efectivo    bigint;
  total_entradas bigint;
  a_banco       bigint;
  a_nequi       bigint;
  a_efectivo    bigint;
  new_compra    uuid;
begin
  -- Total actual de todas las compras marcadas como ajuste
  select coalesce(sum(ci.costo_total), 0)
    into total_ajuste
  from public.compras c
  join public.compra_items ci on ci.compra_id = c.id
  where c.es_ajuste;

  if coalesce(total_ajuste, 0) = 0 then
    return; -- no hay ajuste que repartir
  end if;

  -- Metadatos del ajuste original (se conservan)
  select proveedor_id, fecha, registrado_por
    into prov_id, fecha_aj, reg_por
  from public.compras
  where es_ajuste
  order by created_at
  limit 1;

  -- Entradas reales por medio (abonos)
  select
    coalesce(sum(monto) filter (where medio = 'bancolombia'), 0),
    coalesce(sum(monto) filter (where medio = 'nequi'), 0),
    coalesce(sum(monto) filter (where medio = 'efectivo'), 0)
  into e_banco, e_nequi, e_efectivo
  from public.abonos;

  total_entradas := e_banco + e_nequi + e_efectivo;
  if total_entradas = 0 then
    return; -- sin entradas no hay forma de repartir; se deja como está
  end if;

  -- Reparto proporcional. El residuo de redondeo va a efectivo,
  -- así la suma es EXACTAMENTE total_ajuste y la caja no se mueve.
  a_banco    := round(total_ajuste::numeric * e_banco / total_entradas);
  a_nequi    := round(total_ajuste::numeric * e_nequi / total_entradas);
  a_efectivo := total_ajuste - a_banco - a_nequi;

  -- Borrar el/los ajuste(s) viejo(s) (compra_items caen por cascade)
  delete from public.compras where es_ajuste;

  -- Recrear como una compra-ajuste por medio
  if a_banco > 0 then
    insert into public.compras (proveedor_id, fecha, medio, es_ajuste, nota, registrado_por)
    values (prov_id, fecha_aj, 'bancolombia', true,
            'Ajuste histórico (Bancolombia) — repartido en proporción a las entradas', reg_por)
    returning id into new_compra;
    insert into public.compra_items (compra_id, producto_id, cantidad, costo_unitario)
    values (new_compra, null, 1, a_banco);
  end if;

  if a_nequi > 0 then
    insert into public.compras (proveedor_id, fecha, medio, es_ajuste, nota, registrado_por)
    values (prov_id, fecha_aj, 'nequi', true,
            'Ajuste histórico (Nequi) — repartido en proporción a las entradas', reg_por)
    returning id into new_compra;
    insert into public.compra_items (compra_id, producto_id, cantidad, costo_unitario)
    values (new_compra, null, 1, a_nequi);
  end if;

  if a_efectivo > 0 then
    insert into public.compras (proveedor_id, fecha, medio, es_ajuste, nota, registrado_por)
    values (prov_id, fecha_aj, 'efectivo', true,
            'Ajuste histórico (Efectivo) — repartido en proporción a las entradas', reg_por)
    returning id into new_compra;
    insert into public.compra_items (compra_id, producto_id, cantidad, costo_unitario)
    values (new_compra, null, 1, a_efectivo);
  end if;
end $$;
