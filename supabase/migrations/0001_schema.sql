-- Esquema base: perfiles, productos, ventas, movimientos de inventario, gastos.

create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'cajero' check (role in ('admin', 'cajero')),
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  nombre text not null,
  categoria text not null,
  unidad text not null check (unidad in ('pieza', 'kg', 'paquete', 'manojo')),
  precio numeric(10, 2) not null check (precio >= 0),
  stock numeric(10, 3) not null default 0 check (stock >= 0),
  stock_minimo numeric(10, 3) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_categoria_idx on products (categoria);
create index products_low_stock_idx on products (id) where stock <= stock_minimo;

create table sales (
  id uuid primary key default gen_random_uuid(),
  client_sale_id uuid not null unique,
  cajero_id uuid not null references profiles (id),
  subtotal numeric(10, 2) not null,
  total numeric(10, 2) not null,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
  monto_recibido numeric(10, 2),
  cambio numeric(10, 2),
  created_at timestamptz not null default now()
);

create index sales_created_at_idx on sales (created_at);
create index sales_cajero_id_idx on sales (cajero_id);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid not null references products (id),
  sku text not null,
  nombre text not null,
  cantidad numeric(10, 3) not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null,
  subtotal numeric(10, 2) not null
);

create index sale_items_sale_id_idx on sale_items (sale_id);
create index sale_items_product_id_idx on sale_items (product_id);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  tipo text not null check (tipo in ('entrada', 'salida', 'ajuste')),
  cantidad numeric(10, 3) not null,
  motivo text not null default '',
  referencia_venta_id uuid references sales (id),
  usuario_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index inventory_movements_product_id_idx on inventory_movements (product_id);
create index inventory_movements_created_at_idx on inventory_movements (created_at);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  categoria text not null check (categoria in ('renta', 'electricidad', 'proveedores', 'otros')),
  monto numeric(10, 2) not null check (monto >= 0),
  fecha date not null default current_date,
  usuario_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index expenses_fecha_idx on expenses (fecha);
create index expenses_usuario_id_idx on expenses (usuario_id);

create table whatsapp_conversations (
  from_number text primary key,
  last_question text,
  last_answer text,
  updated_at timestamptz not null default now()
);

-- Crea el perfil (rol cajero por defecto) cuando alguien se registra en Supabase Auth.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
