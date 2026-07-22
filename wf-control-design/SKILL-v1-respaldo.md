---
name: wf-control-design
description: Sistema de diseño visual de WF Control (Warpath Forge). Úsalo SIEMPRE que construyas o modifiques cualquier pantalla, card, botón, formulario, tabla o componente de WF Control, aunque el usuario no diga "diseño" explícitamente. Define paleta, tipografía, espaciado, cards, botones, estados y reglas de estilo para que TODA la interfaz salga consistente: minimalista, fondo blanco, letra negra, y azul según la importancia.
---

# WF Control — Sistema de diseño

La identidad de WF Control es **minimalista pero con carácter**: fondo blanco, mucho aire, tipografía grande y segura, y un solo azul que resalta lo importante. Nada grita; todo se siente limpio y profesional. Si dudas entre agregar o quitar, **quita**.

## Regla de oro del color

- **Negro** es el color por defecto de todo el texto.
- **Azul** (`#1466FF`) se reserva para lo más importante de cada pantalla: la métrica principal, la acción principal (botón primario) y el estado activo. Es un acento, no un relleno — si todo es azul, nada es importante.
- **Colores de apoyo** solo codifican estado, nunca decoran: verde = positivo/ganancia, rojo = vencido/deuda, ámbar = vence hoy/atención.

## Paleta (hex exactos)

Fondo y superficies
- Página: `#F7F7F4` (blanco cálido)
- Card / superficie: `#FFFFFF`
- Borde fino: `rgba(0,0,0,0.08)`
- Borde fuerte (hover/divisor): `rgba(0,0,0,0.14)`

Texto
- Principal: `#0A0A0A`
- Secundario: `#6E6E6A`
- Tenue (labels, metadatos): `#9A9A95`

Azul (importancia / primario)
- Azul: `#1466FF`
- Azul hover: `#0F52CC`
- Fondo azul tenue (chips): `#EAF1FF`

Apoyo (solo estado)
- Verde texto `#16A34A` · fondo `#E7F6EC`
- Rojo texto `#DC2626` · fondo `#FDECEC`
- Ámbar texto `#B45309` · fondo `#FDF3E3`

Todo funciona sobre blanco. Este es un tema claro; no invertir a oscuro.

## Tipografía

- Fuente: **Inter** (`400` regular, `500` medium, `600` para cifras grandes).
- Cifras protagonistas (caja, totales): 40–56px, `font-weight:500/600`, `letter-spacing:-0.03em`. Confiadas y grandes.
- Títulos de sección: 18–22px, `500`.
- Cuerpo: 14–15px, `400`.
- Labels/etiquetas: 11–12px, MAYÚSCULAS, `letter-spacing:0.12em`, color tenue.
- Siempre **sentence case** en botones y títulos (no Title Case, no MAYÚSCULAS salvo los labels).

## Espaciado y formas

- Rejilla base de 8px. Sé generoso con el aire — el minimalismo vive en el espacio vacío.
- Radio de cards: `16px`. Radio de inputs/controles: `10px`.
- Botones y pastillas (badges, chips, filtros): **redondeados completos** (`border-radius: 999px`).
- Plano: sin sombras pesadas. Máximo una sombra muy sutil (`0 1px 2px rgba(0,0,0,0.04)`) en cards elevadas. Separar con bordes finos, no con sombras.
- Bordes de `1px` finos. Nada de bordes gruesos.

## Componentes

**Métrica / KPI**: label tenue en mayúsculas arriba + cifra grande abajo. La métrica más importante de la vista va en azul; las demás en negro. Debajo, un dato de apoyo pequeño en color tenue.

**Card**: `#FFFFFF`, borde fino de 1px, radio 16px, padding 20–24px. Sin sombra o sombra mínima.

**Botón primario**: fondo azul `#1466FF`, texto blanco, redondeado completo, padding cómodo (12–16px vertical). Hover a `#0F52CC`. Solo UNO primario por vista.

**Botón secundario**: fondo blanco, borde fino, texto negro, redondeado completo. Hover: fondo `#F7F7F4`.

**Badge de estado**: pastilla con fondo tenue + texto del mismo color de estado (verde/rojo/ámbar/azul). Ej: "vencida" → fondo rojo tenue, texto rojo.

**Lista de filas** (ej. "requiere atención", movimientos de caja): filas separadas por divisor fino de 1px; a la izquierda un punto de estado pequeño (6px) + texto en negro; a la derecha el monto. Sin cards por fila — filas limpias con divisores.

**Tabla**: encabezados en label tenue mayúscula; filas con divisor fino; números alineados a la derecha. `table-layout: fixed` en anchos reducidos.

**Input / formulario**: alto ~40px, borde fino, radio 10px, foco con anillo azul (`0 0 0 3px #EAF1FF` + borde azul). Placeholder en color tenue con un ejemplo real.

## Estados

- Foco visible siempre: anillo azul tenue.
- Hover sutil (cambio leve de fondo o de opacidad), nunca brusco.
- Evita botones deshabilitados; si hay que hacerlo, baja opacidad y explica por qué.

## Movimiento

Sutil y con propósito. Transiciones de 150–250ms en hover/foco. Se permite **un** detalle de "brillo" (sweep de blanco sobre azul) en una cifra hero como firma de marca, pero con moderación y respetando `prefers-reduced-motion`. Nada de animaciones que distraigan.

## Contenido y formato (español, Colombia)

- Todo en español, tono directo y cálido, sentence case.
- Moneda en pesos colombianos: símbolo `$`, separador de miles con punto, sin decimales. Ej: `$1.920.000`.
- Fechas claras y cortas. Redondea siempre los números que se muestran.

## Qué evitar

- Varios colores de acento compitiendo (rainbow). Un solo azul manda.
- Sombras pesadas, gradientes decorativos, bordes gruesos.
- Pantallas recargadas. Si se ve apretado, quita elementos o dales aire.
- Fondos oscuros. WF Control es tema claro.
