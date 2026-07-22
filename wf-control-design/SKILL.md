---
name: wf-control-design
description: Sistema de diseño oficial de WF Control (Warpath Forge). Úsalo SIEMPRE que construyas, modifiques o refactorices cualquier pantalla, componente, card, botón, formulario, tabla, badge, gráfico, respuesta de IA, mensaje de WhatsApp o cualquier elemento visual de WF Control, aunque el usuario no mencione "diseño" explícitamente. Esta skill define la identidad de marca completa: modo dual claro/oscuro, paleta azul Warpath, tipografía, espaciado, cards, botones, estados, gradientes, animaciones, iconografía, formato de respuestas de IA y tono de voz. TODA la interfaz debe pasar por esta skill sin excepción — si tienes duda entre agregar o quitar decoración, quita; si tienes duda entre seguir la skill o improvisar, sigue la skill.
---

# WF Control — Design System

**Versión 2.0 — Warpath Forge Edition**

La identidad de WF Control es **forjada, precisa y con carácter**: como el logo Warpath Forge, todo debe sentirse afilado, premium y confiado — sin gritar. Base limpia (clara u oscura), un azul eléctrico que corta como filo, cifras protagonistas, y micro-detalles que dan vida sin distraer.

Filosofía en tres palabras: **Preciso. Forjado. Confiado.**

Si dudas entre agregar o quitar decoración, quita. La marca se muestra en la ejecución, no en el ruido.

## 1. Marca e identidad

### Logo

El logo Warpath Forge es el símbolo maestro. Se usa así:

- **Login**: logo completo (Warpath Forge con letras) centrado, tamaño grande, sobre el fondo con un leve resplandor azul detrás.
- **Header de la app**: un ícono simplificado del "WF" del logo (24×24px) a la izquierda del texto `WF Control` en tipografía 500. El WF ícono usa gradiente azul (`#1466FF` → `#0052E0`).
- **Favicon y móvil**: solo el "WF" simplificado.

### Firma visual

La marca tiene tres firmas visuales que se repiten como sellos:

1. **El azul filo** — el color primario nunca se apaga. Es el filo.
2. **El resplandor** — un halo azul muy sutil (blur 40-60px, opacidad 15%) detrás de elementos hero como la cifra de Caja o el logo en login. Nunca decorativo, siempre para dar peso.
3. **Los bordes afilados** — bordes de 1px con contraste sutil, esquinas redondeadas pero no infantiles (12-16px, no 24+).

## 2. Modo dual claro/oscuro

WF Control ofrece dos modos completos. El usuario alterna con un switch en el header.

### Persistencia

La preferencia se guarda en `localStorage` y respeta la preferencia del sistema por defecto (`prefers-color-scheme`).

### Switch

Botón redondo de 32px en el header, ícono sol/luna que se transiciona con rotación suave (300ms). No decir "modo oscuro" con texto — el ícono basta.

### Modo Claro — el default

Inspiración: la referencia mobile de fondo blanco cálido, cards flotando limpias, gradientes suaves. Sensación: profesional de día, un dashboard financiero premium.

### Modo Oscuro — la fuerza

Inspiración: el logo Warpath Forge sobre negro texturizado, azul brillando. Sensación: profesional de noche, poderoso, el azul realmente brilla.

Regla: **ambos modos deben ser igual de trabajables.** El oscuro no es "un truco", es un modo completo.

## 3. Paleta de color

Todos los valores como CSS variables. **Nunca hardcodear colores en componentes.**

### 3.1 Modo claro

```css
/* Fondos y superficies */
--bg-page: #F7F7F4;              /* fondo cálido */
--bg-page-alt: #FFFFFF;          /* zonas de contenido plano */
--surface-1: #FFFFFF;            /* card base */
--surface-2: #FBFBF9;            /* card sobre card, inputs */
--surface-3: #F0F0EC;            /* hover sutil */

/* Bordes */
--border-subtle: rgba(10, 10, 10, 0.06);
--border-default: rgba(10, 10, 10, 0.10);
--border-strong: rgba(10, 10, 10, 0.16);
--border-focus: #1466FF;

/* Texto */
--text-primary: #0A0A0A;
--text-secondary: #52524E;
--text-tertiary: #8B8B85;        /* labels, metadatos */
--text-quaternary: #B8B8B2;      /* placeholders */
--text-on-primary: #FFFFFF;      /* texto sobre botón azul */
--text-on-dark: #FFFFFF;

/* Sombras */
--shadow-sm: 0 1px 2px rgba(10, 10, 10, 0.04);
--shadow-md: 0 2px 8px rgba(10, 10, 10, 0.06), 0 1px 2px rgba(10, 10, 10, 0.04);
--shadow-lg: 0 8px 24px rgba(10, 10, 10, 0.08), 0 2px 4px rgba(10, 10, 10, 0.04);
--shadow-glow-blue: 0 0 40px rgba(20, 102, 255, 0.15);
```

### 3.2 Modo oscuro

```css
/* Fondos y superficies */
--bg-page: #0A0B0F;              /* casi negro con matiz azul */
--bg-page-alt: #0D0E13;
--surface-1: #14151B;            /* card base */
--surface-2: #1A1B23;            /* card sobre card, inputs */
--surface-3: #22232D;            /* hover sutil */

/* Bordes */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.10);
--border-strong: rgba(255, 255, 255, 0.16);
--border-focus: #4DA6FF;

/* Texto */
--text-primary: #F5F5F3;
--text-secondary: #A8A8A2;
--text-tertiary: #6D6D68;
--text-quaternary: #46464A;
--text-on-primary: #FFFFFF;
--text-on-dark: #FFFFFF;

/* Sombras (más glow, menos drop) */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.6);
--shadow-glow-blue: 0 0 60px rgba(77, 166, 255, 0.25);
```

### 3.3 Marca — Azul Warpath (idéntico en ambos modos)

```css
--brand-primary: #1466FF;        /* azul principal, botones */
--brand-primary-hover: #0F52CC;
--brand-primary-active: #0A44AA;
--brand-deep: #0052E0;           /* azul profundo, gradientes */
--brand-bright: #4DA6FF;         /* highlight, glow */
--brand-tint: #EAF1FF;           /* fondo tenue en claro */
--brand-tint-dark: rgba(77, 166, 255, 0.12); /* fondo tenue en oscuro */
```

### 3.4 Gradientes de marca

```css
--gradient-brand: linear-gradient(135deg, #1466FF 0%, #0052E0 100%);
--gradient-brand-vertical: linear-gradient(180deg, #4DA6FF 0%, #1466FF 100%);
--gradient-hero-light: linear-gradient(135deg, #EAF1FF 0%, #F7F7F4 100%);
--gradient-hero-dark: linear-gradient(135deg, rgba(20, 102, 255, 0.08) 0%, rgba(10, 11, 15, 1) 100%);
```

### 3.5 Estados

```css
/* Éxito / positivo (ganancia) */
--success-fg: #16A34A;
--success-bg: #E7F6EC;
--success-fg-dark: #4ADE80;
--success-bg-dark: rgba(74, 222, 128, 0.14);

/* Peligro / vencido */
--danger-fg: #DC2626;
--danger-bg: #FDECEC;
--danger-fg-dark: #F87171;
--danger-bg-dark: rgba(248, 113, 113, 0.14);

/* Advertencia / vence hoy */
--warning-fg: #B45309;
--warning-bg: #FDF3E3;
--warning-fg-dark: #FBBF24;
--warning-bg-dark: rgba(251, 191, 36, 0.14);

/* Info (azul acento) — igual a brand-primary */
```

### 3.6 Regla del color

- **Un solo azul manda por vista.** No competir dos gradientes por pantalla.
- Colores de estado solo codifican estado, no decoran.
- Nunca usar rojo/verde/ámbar como color principal de una card grande — son alertas puntuales.

## 4. Tipografía

### 4.1 Fuente

**Inter** (Google Fonts) — variable font si es posible, con estos pesos activos:

- 400 (Regular) — cuerpo
- 500 (Medium) — títulos, cifras normales, énfasis
- 600 (SemiBold) — cifras protagonistas
- 700 (Bold) — solo para el logo/marca

Alternativa premium si quieres considerar: `Söhne` o `Geist` (Vercel). Inter es la default segura.

### 4.2 Escala tipográfica

```css
--font-display: 56px;    /* cifra hero única (Caja) */
--font-hero: 40px;       /* cifras principales */
--font-h1: 28px;         /* título de pantalla */
--font-h2: 20px;         /* título de sección */
--font-h3: 16px;         /* título de card */
--font-body: 15px;       /* cuerpo default */
--font-body-sm: 14px;    /* cuerpo secundario */
--font-caption: 13px;    /* metadatos, timestamps */
--font-micro: 11px;      /* labels en mayúsculas */
```

### 4.3 Uso

**Cifras protagonistas** (Caja, ganancia, deuda):

- `font-family: Inter`
- `font-weight: 600`
- `letter-spacing: -0.03em` (tight, cinematográfico)
- `line-height: 1`
- **Números tabulares**: `font-variant-numeric: tabular-nums` — obligatorio para que las cifras no bailen al actualizarse.

**Títulos de pantalla (h1)**:

- `font-weight: 500`
- `letter-spacing: -0.02em`
- `line-height: 1.15`

**Labels en mayúsculas** (los que van arriba de cifras):

- `font-size: 11px`
- `font-weight: 500`
- `letter-spacing: 0.14em`
- `text-transform: uppercase`
- `color: var(--text-tertiary)`

**Cuerpo**:

- `font-weight: 400`
- `line-height: 1.55`

**Sentence case en todo**: botones, títulos, tabs. Nada de Title Case o MAYÚSCULAS excepto los labels micro.

## 5. Espaciado y forma

### 5.1 Rejilla base

Escala de 4px. Todo en múltiplos: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

**Regla del aire**: el minimalismo vive en el espacio vacío. Cuando dudes, dale más aire. Padding interno de cards mínimo 20px; entre secciones grandes mínimo 32px.

### 5.2 Radios

```css
--radius-sm: 8px;    /* botones pequeños, badges */
--radius-md: 12px;   /* inputs, botones normales */
--radius-lg: 16px;   /* cards */
--radius-xl: 20px;   /* cards hero */
--radius-full: 999px; /* pills, avatares */
```

Botones y badges siempre `--radius-full` (pill). Cards siempre `--radius-lg` o `--radius-xl`. Inputs `--radius-md`.

### 5.3 Contenedores

- Ancho máximo de la app: `1200px` centrado.
- Padding lateral en desktop: `48px`. En móvil: `20px`.
- Gap entre cards de la misma fila: `16px`.
- Gap entre secciones grandes: `32px`.

## 6. Componentes

### 6.1 Botón primario

Fondo con gradiente de marca (`--gradient-brand`), texto blanco, borde sutil interno para dar sensación de "botón físico".

```css
background: var(--gradient-brand);
color: var(--text-on-primary);
font-weight: 500;
font-size: 15px;
padding: 12px 22px;
border-radius: var(--radius-full);
box-shadow: 0 1px 2px rgba(20, 102, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.15);
transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
```

Hover: `filter: brightness(1.08)` + `box-shadow` con más glow. Active: `transform: scale(0.98)`. **Solo UN botón primario por vista** — el que representa la acción principal.

### 6.2 Botón secundario

Fondo transparente, borde 1px, texto principal.

```css
background: transparent;
color: var(--text-primary);
border: 1px solid var(--border-strong);
padding: 12px 22px;
border-radius: var(--radius-full);
```

Hover: `background: var(--surface-3)`.

### 6.3 Botón terciario (texto/link)

Solo texto en color `--brand-primary`, sin borde, sin fondo. Underline solo en hover.

### 6.4 Card estándar

```css
background: var(--surface-1);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg);
padding: 24px;
box-shadow: var(--shadow-sm);
```

Card interactiva (clickable):

- Agregar `transition: transform 200ms, box-shadow 200ms, border-color 200ms`.
- Hover: `transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-default);`.

### 6.5 Card hero (Caja, KPI principal)

La estrella de la pantalla. Lleva un gradiente sutil de fondo y un glow atrás.

```css
background: var(--surface-1);
background-image: var(--gradient-hero-light); /* o -dark según modo */
border: 1px solid var(--border-subtle);
border-radius: var(--radius-xl);
padding: 32px;
position: relative;
overflow: hidden;
```

Y detrás, un halo azul:

```css
/* pseudo-elemento ::before */
position: absolute;
top: -40px; right: -40px;
width: 240px; height: 240px;
background: radial-gradient(circle, rgba(20, 102, 255, 0.15), transparent 70%);
filter: blur(40px);
pointer-events: none;
```

La cifra dentro es `--font-display`, weight 600, con `font-variant-numeric: tabular-nums`.

### 6.6 Métrica / KPI compacto

```
[LABEL EN MAYÚSCULAS TENUE]
[Cifra grande, weight 600]
[metadato pequeño color secundario]
```

Ejemplo estructura:

```html
<div class="metric">
  <div class="metric-label">TE DEBEN</div>
  <div class="metric-value">$865.000</div>
  <div class="metric-caption">7 clientes con deuda</div>
</div>
```

### 6.7 Badge de estado

Pill con fondo tenue del color y texto del color fuerte.

```css
padding: 4px 10px;
border-radius: var(--radius-full);
font-size: 12px;
font-weight: 500;
letter-spacing: 0;
```

Ejemplos:

- `vencida` → fondo `--danger-bg`, texto `--danger-fg`
- `vence hoy` → fondo `--warning-bg`, texto `--warning-fg`
- `pagada` → fondo `--success-bg`, texto `--success-fg`
- `parcial` → fondo `--brand-tint`, texto `--brand-primary`
- `pendiente` → fondo `--surface-3`, texto `--text-secondary`

### 6.8 Input / formulario

```css
height: 44px;
padding: 0 14px;
background: var(--surface-2);
border: 1px solid var(--border-default);
border-radius: var(--radius-md);
font-size: 15px;
color: var(--text-primary);
transition: border-color 150ms, box-shadow 150ms, background 150ms;
```

Focus:

```css
border-color: var(--brand-primary);
box-shadow: 0 0 0 3px var(--brand-tint);
background: var(--surface-1);
outline: none;
```

Placeholder en `--text-quaternary`, con ejemplo real ("Ej: 3215695768") no genérico ("teléfono").

### 6.9 Lista de filas (movimientos, requiere atención)

Filas separadas por divisor de 1px `--border-subtle`. A la izquierda un punto de estado de 8px del color del estado. A la derecha el monto o metadato. Sin cards por fila — la lista es limpia.

```css
.row {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.row:last-child { border-bottom: none; }
```

Hover en fila clickable: `background: var(--surface-2)` con padding negativo compensado para no bailar.

### 6.10 Tabla

Encabezados en label micro (mayúsculas tenues). Filas con divisor fino. Números alineados a la derecha con `tabular-nums`. Zebra opcional muy sutil.

```css
th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-tertiary);
  font-weight: 500;
  text-align: left;
  padding: 12px 0;
}
td {
  padding: 14px 0;
  border-top: 1px solid var(--border-subtle);
  font-size: 15px;
}
td.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
```

### 6.11 Header de la app

Barra superior fija, altura 64px, fondo `--bg-page` con `backdrop-filter: blur(12px)` y borde inferior `--border-subtle`.

Contenido:

- Izquierda: [ícono WF con gradiente 24×24] + "WF Control" (weight 500)
- Centro: navegación con pills (activo con `--brand-tint` de fondo y `--brand-primary` de color)
- Derecha: nombre de usuario + botón "Salir" en botón terciario + switch de modo claro/oscuro

### 6.12 Tabs de navegación

Pills redondeados. Estado inactivo: transparente, texto `--text-secondary`. Estado activo: `--brand-tint` de fondo, `--brand-primary` de color, weight 500. Transición 200ms.

## 7. Estados e interacción

### 7.1 Focus visible

Siempre visible. Anillo de 3px en `--brand-tint` alrededor del elemento. Nunca quitar el outline sin reemplazarlo.

### 7.2 Hover

Sutil siempre. Nunca cambios bruscos de color. Preferir:

- Cambio de fondo a `--surface-3`
- `transform: translateY(-2px)` en cards
- `filter: brightness(1.08)` en botones con gradiente

### 7.3 Disabled

`opacity: 0.5` + `cursor: not-allowed`. Nunca esconder por qué está deshabilitado — mostrar tooltip o hint debajo.

### 7.4 Loading

Nunca dejar la pantalla vacía. Usar **skeletons** con la forma exacta del contenido que va a aparecer:

```css
background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 50%, var(--surface-2) 100%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

### 7.5 Empty states

Cuando no hay datos, mostrar:

- Ícono suave (grande, `--text-tertiary`)
- Título corto ("Sin pedidos pendientes")
- Descripción amable ("Cuando llegue un pedido, aparecerá aquí")
- Si aplica, botón para la acción principal ("Nuevo pedido")

Nunca dejar una card vacía sin mensaje.

## 8. Animación y motion

Filosofía: sutil, con propósito, respeta `prefers-reduced-motion`.

### 8.1 Curvas y duraciones

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
```

### 8.2 Entradas

Cards y contenido nuevo entran con:

```css
opacity: 0 → 1
transform: translateY(8px) → translateY(0)
duration: 400ms;
ease: var(--ease-out);
```

En listas, aplicar stagger de 40ms entre elementos (máximo 6 elementos, después todo junto).

### 8.3 Cifras que cambian

Cuando una cifra grande se actualiza (ej. Caja después de un abono), animar con count-up de 600ms usando `ease-out`. Nunca cambiar de golpe.

### 8.4 El shimmer de la marca

En la cifra Hero (Caja principal), un shimmer azul-blanco muy sutil sweep de 3s en loop:

```css
background: linear-gradient(100deg, currentColor 30%, rgba(77, 166, 255, 0.8) 50%, currentColor 70%);
background-size: 200% 100%;
-webkit-background-clip: text;
background-clip: text;
color: transparent;
animation: shimmer 3s linear infinite;
```

Solo **una** cifra por vista puede tener shimmer. Es firma de marca, no efecto.

### 8.5 Hover en cards

```css
transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
&:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
```

### 8.6 Cambio de modo claro/oscuro

Al cambiar el switch: transición global de 300ms en `background-color` y `color` de todos los elementos:

```css
* { transition: background-color 300ms ease, border-color 300ms ease, color 300ms ease; }
```

### 8.7 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 9. Iconografía

Librería: **Lucide React** (`lucide-react`). Nunca mezclar librerías.

Tamaños estándar:

- Micro: 14px (dentro de badges)
- Small: 16px (dentro de inputs, filas)
- Default: 20px (botones, navegación)
- Large: 24px (headers)
- Hero: 32-40px (empty states)

Stroke width: **1.75** default (más elegante que el 2 default).

Color: hereda `currentColor`. Nunca hardcodear.

Íconos por sección (canónicos):

- Inicio: `LayoutDashboard`
- Clientes: `Users`
- Pedidos: `ShoppingBag` (no `ShoppingCart` — es más limpio)
- Caja: `Wallet`
- Productos: `Package`
- KPIs: `TrendingUp`
- Mensajes: `MessageCircle`
- Salir: `LogOut`
- Modo claro: `Sun`
- Modo oscuro: `Moon`
- Asistente IA: `Sparkles`
- WhatsApp: usar el ícono oficial de WhatsApp (SVG custom, no Lucide)

## 10. Respuestas de IA — formato

Esto es crítico. Las respuestas del asistente NUNCA se muestran como markdown crudo. Se renderizan siempre con formato bonito.

### 10.1 Estructura

Cada respuesta tiene:

1. **Resumen ejecutivo** (1 línea, cifra clave en `--brand-primary`, `--font-h2`, weight 600)
2. **Detalle** (tabla o lista visual)
3. **CTA opcional** (botón para actuar sobre la respuesta)

### 10.2 Prompt al modelo Claude

La Edge Function debe pedir a Claude que responda en un JSON estructurado que el frontend renderiza:

```json
{
  "summary": "Te deben $865.000 repartidos en 7 clientes.",
  "highlight": "$865.000",
  "type": "clientes_deuda",
  "items": [
    { "cliente": "Walter Orozco", "monto": 285000, "estado": "pendiente" },
    { "cliente": "Martha Orozco", "monto": 145000, "estado": "pendiente" }
  ],
  "cta": { "label": "Ver todos los deudores", "action": "clientes/deuda" }
}
```

El frontend detecta `type` y renderiza el componente correcto: tabla de clientes con badges, tarjetas de pedidos, lista de recompras, etc.

### 10.3 Componente de tabla en respuesta

Cuando `type` es `clientes_deuda` o similar, renderizar como tabla nativa (sección 6.10), con:

- Nombre a la izquierda
- Monto a la derecha con `tabular-nums`, weight 500
- Badge de estado

Nunca mostrar `| Cliente | Deuda |` con pipes. Nunca.

### 10.4 Fallback

Si Claude responde texto plano (sin JSON), el frontend detecta y renderiza como prosa dentro de una card con padding cómodo, texto `--font-body` en `--text-primary`. Nunca como código monospace.

## 11. Mensajes de WhatsApp — formato

Los mensajes que genera la IA para WhatsApp siguen estas reglas:

### 11.1 Tono

- Directo, cálido, tuteo colombiano ("Hola Walter, ¿cómo estás?")
- Nunca formal ("Estimado señor")
- Nunca robótico ("Le informamos que...")
- Máximo 4 líneas incluyendo saludo y despedida
- Emojis con moderación (1 por mensaje máximo, si aplica)

### 11.2 Estructura por caso

**Cobro de cuota vencida:**

```
Hola [nombre], espero estés bien 💪
Te recuerdo que tienes pendiente la cuota de $[monto] que venció el [fecha].
¿La podemos coordinar hoy?
Gracias!
```

**Aviso de recompra:**

```
Hola [nombre]! Vi que se te está acabando tu [producto].
Tengo listo el próximo para que no te quedes sin. ¿Te lo despacho?
```

**Promo**: Que la IA improvise pero manteniendo el tono. Nunca vender agresivo.

### 11.3 Preview en la app

Antes de enviar, mostrar el mensaje en un contenedor tipo burbuja de chat con el color verde WhatsApp muy sutil de fondo, esquinas redondeadas grandes tipo chat, y botón editable. El usuario siempre puede modificar antes de enviar.

## 12. Tono de voz y contenido

### 12.1 En la app

- Español colombiano, tuteo directo, cálido pero profesional.
- Nunca condescendiente ("Solo tienes que...").
- Nunca dramático ("¡Cuidado!" "¡Atención!").
- Nunca corporativo ("Le informamos que...").

Ejemplos:

- ✅ "Hoy paga Walter"
- ❌ "El cliente Walter Orozco tiene un pago programado para el día de hoy"
- ✅ "Nadie está vencido. Todo al día."
- ❌ "No hay clientes con pagos vencidos en este momento"
- ✅ "Nuevo pedido"
- ❌ "Crear un nuevo pedido en el sistema"

### 12.2 Formato de números

- Moneda: pesos colombianos, símbolo `$`, separador de miles con punto, sin decimales.
- Ejemplos: `$1.920.000`, `$50.000`, `$0`
- Redondear siempre lo que se muestra. Nunca `$1.920.000,00`.
- Porcentajes con 1 decimal máximo: `+12.4%` o `+12%`.

### 12.3 Formato de fechas

- Cortas: `22 de jul`, `5 de ago`.
- Relativas cuando aplique: `hoy`, `mañana`, `en 3 días`, `hace 8 días`.
- Nunca `2026-07-22` en pantalla — solo en base de datos.

## 13. Qué evitar

**Colores:**

- Varios azules distintos compitiendo. Un azul manda.
- Rainbow (más de 3 acentos en una vista).
- Rojo/verde grandes como decoración. Solo estado.

**Formas:**

- Sombras pesadas o "web 2.0".
- Bordes gruesos (>1px, salvo casos justificados).
- Gradientes decorativos random. Solo gradientes de marca en zonas hero.
- Radios exagerados (>24px salvo en pills).

**Tipografía:**

- MAYÚSCULAS gritando (excepto labels micro).
- Múltiples fuentes.
- `text-shadow` decorativo (solo en el logo, no en texto).

**Interacción:**

- Animaciones que distraen o son >600ms.
- Hover que cambia mucho (movimiento grande, cambio de color drástico).
- Botones deshabilitados sin explicación.
- Estados de carga vacíos (pantalla en blanco).

**Contenido:**

- Texto en inglés en la interfaz (excepto términos técnicos aceptados: "email").
- Markdown crudo en respuestas de IA.
- Números sin `tabular-nums` en tablas o cifras que se actualizan.

**Layout:**

- Cards apretadas sin aire.
- Todo mismo tamaño (falta jerarquía).
- Ausencia de una acción primaria clara por vista.

## Checklist antes de mergear una pantalla

Antes de considerar una pantalla lista, verificar:

- [ ] Funciona en modo claro Y oscuro (probado).
- [ ] Todas las cifras usan `font-variant-numeric: tabular-nums`.
- [ ] Hay UNA acción primaria clara.
- [ ] Focus visible en todos los elementos interactivos.
- [ ] Empty state definido si aplica.
- [ ] Loading state con skeleton.
- [ ] Responsive (probar 375px, 768px, 1200px).
- [ ] Todos los colores vienen de CSS variables, ninguno hardcodeado.
- [ ] Tono de voz en español colombiano, sentence case.
- [ ] Respeta `prefers-reduced-motion`.

*"Preciso. Forjado. Confiado." — Warpath Forge*
