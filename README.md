# ERP Supermercado

ERP para un supermercado de barrio: punto de venta, inventario, finanzas, usuarios/roles
y un agente de IA por WhatsApp. Next.js (App Router) + TypeScript + MUI, Supabase Auth
para login, Postgres (el mismo de Supabase) via TypeORM para todos los datos, Twilio
WhatsApp sandbox + Claude para el agente.

## Cuentas de demo

Ya cargadas en la base (100 productos + 2 ventas de ejemplo):

- Admin: `admin@erp-test.local` / `TestPass123!`
- Cajero: `cajero@erp-test.local` / `TestPass123!`

## Stack y por que

- **Next.js App Router + TypeScript + MUI** (pedido por el cliente).
- **Supabase Auth**: login/registro/sesion. No se usa `supabase-js` para leer/escribir
  datos de negocio.
- **TypeORM** sobre el Postgres de Supabase: toda la logica de POS/inventario/finanzas/
  usuarios corre en Server Actions y Server Components del lado del servidor. La
  autorizacion (admin vs cajero) se valida en ese codigo de servidor, no con RLS.
- **Twilio WhatsApp sandbox + Claude (`@anthropic-ai/sdk`)**: agente de solo lectura que
  responde preguntas del dueno con datos reales via tool-use.

## Requisitos previos

1. Cuenta de [Supabase](https://supabase.com) (proyecto nuevo).
2. Cuenta de [Anthropic](https://console.anthropic.com) con una API key.
3. Cuenta de [Twilio](https://www.twilio.com) (el sandbox de WhatsApp es gratis).
4. Node 20+.

## Setup

### 1. Base de datos (Supabase)

1. Crea un proyecto en Supabase.
2. Abre el **SQL Editor** del proyecto y pega, en orden, el contenido de:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_functions_triggers.sql`
3. En **Project Settings > Database > Connect > Connection string > URI**, copia el
   connection string (usa el **Session pooler** si vas a desplegar en Vercel) y
   reemplaza `[YOUR-PASSWORD]` con la password real de la base.

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y llena:

```
NEXT_PUBLIC_SUPABASE_URL=          # Project Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Project Settings > API
DATABASE_URL=                      # el connection string del paso anterior
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANTHROPIC_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_OWNER_NUMBERS=whatsapp:+52XXXXXXXXXX
```

### 3. Instalar y correr

```bash
npm install
npm run dev
```

### 4. Crear el primer administrador

1. Entra a `http://localhost:3000/login`, pestana "Crear cuenta", registra tu correo.
   El trigger de la migracion crea tu perfil con rol `cajero` automaticamente.
2. En el **SQL Editor** de Supabase, promuevete a admin (una sola vez):
   ```sql
   update profiles set role = 'admin' where id = (select id from auth.users where email = 'tu@correo.com');
   ```
3. Inicia sesion de nuevo. Ya deberias ver Finanzas, Usuarios e Importar CSV en el menu.

### 5. Cargar el catalogo

Como admin, ve a **Importar CSV** y sube `public/productos_supermercado.csv` (los 100
productos ya estan incluidos en el repo).

### 6. Agente de WhatsApp (Twilio sandbox)

1. En la consola de Twilio: **Messaging > Try it out > Send a WhatsApp message**, sigue
   las instrucciones para unir tu numero al sandbox (mandas `join <palabra-clave>` al
   numero de Twilio desde WhatsApp). El sandbox se desconecta si pasan 72h sin actividad
   -- hay que volver a unirse.
2. Para probar en local necesitas exponer tu `localhost` con algo como `ngrok http 3000`
   y usar esa URL como `NEXT_PUBLIC_SITE_URL` (la validacion de firma de Twilio depende
   de que coincida exactamente con la URL que Twilio llamo).
3. En la consola de Twilio, configura el webhook del sandbox de WhatsApp
   (**"WHEN A MESSAGE COMES IN"**) a `https://<tu-url>/api/whatsapp/webhook`, metodo `POST`.
4. `WHATSAPP_OWNER_NUMBERS` debe incluir tu numero en formato `whatsapp:+52...` -- solo
   esos numeros pueden usar el agente (expone datos financieros del negocio).
5. Manda un mensaje como "cuanto vendimos hoy?" desde WhatsApp.

## Estructura

```
supabase/migrations/       Esquema SQL (pegar en el SQL Editor de Supabase)
src/lib/db/                Entidades TypeORM + DataSource
src/lib/auth/session.ts    Identidad (Supabase Auth) + rol (tabla profiles via TypeORM)
src/lib/actions/           Server Actions (checkout, ajustes de stock, gastos, roles)
src/lib/whatsapp/          Tools + loop de Claude para el agente de WhatsApp
src/app/(app)/             Paginas protegidas (requiere sesion)
src/app/(app)/(admin)/     Paginas solo-admin (finanzas, usuarios, importar CSV)
src/app/api/whatsapp/      Webhook de Twilio
```

## Roles

- **Cajero**: POS, consulta de inventario y de movimientos.
- **Administrador**: todo lo anterior + finanzas, gastos, importar CSV, usuarios.

## Deploy (Vercel)

1. Push a un repo publico de GitHub.
2. Importa el repo en Vercel, agrega las mismas variables de entorno de `.env.local`
   (usa el connection string con el **Session pooler** de Supabase para `DATABASE_URL`
   en produccion/serverless).
3. `NEXT_PUBLIC_SITE_URL` debe ser la URL final de Vercel -- actualizala tambien en el
   webhook de Twilio.

## Notas de diseno

- El checkout del POS y los ajustes de stock corren como funciones de Postgres
  (`process_sale`, `adjust_stock`) invocadas via TypeORM: el `UPDATE ... WHERE stock >=
  cantidad` toma el lock de fila y valida el stock en un solo statement, para que las dos
  cajas puedan vender el mismo producto al mismo tiempo sin condiciones de carrera.
- Los movimientos de inventario (`inventory_movements`) los genera un trigger en
  `products` (`AFTER UPDATE OF stock`), no codigo de aplicacion repetido: la carga
  inicial del CSV es un `INSERT` (sin movimientos, sin ruido) y cualquier venta o ajuste
  posterior es un `UPDATE` (se registra automaticamente).
- El "flujo de caja" en Finanzas usa todas las ventas (cualquier metodo de pago) como
  ingresos, no solo efectivo -- es la lectura mas util para un dashboard general del
  negocio, documentado aqui por si se esperaba la lectura de caja-en-efectivo.
