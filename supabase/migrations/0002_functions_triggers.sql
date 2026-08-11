-- Trigger central de movimientos + funciones de checkout (POS) y ajuste manual de stock.
--
-- La app usa TypeORM con una conexion de servicio (no PostgREST), asi que no hay RLS ni
-- auth.uid(): la autorizacion (admin vs cajero) se valida en el servidor (Next.js) antes
-- de llamar estas funciones, y quien hizo la accion se pasa explicito como parametro.
--
-- Se mantienen como funciones de Postgres (invocadas desde TypeORM via query()) porque
-- el checkout necesita ser una transaccion atomica con locking de fila -- eso es mas
-- simple y robusto de garantizar en SQL que reimplementarlo a mano en TypeORM.

create function log_stock_movement() returns trigger
language plpgsql set search_path = public
as $$
declare
  v_ctx jsonb;
  v_delta numeric;
begin
  v_delta := new.stock - old.stock;
  if v_delta = 0 then
    return new;
  end if;

  v_ctx := nullif(current_setting('app.movement_context', true), '')::jsonb;

  insert into inventory_movements (product_id, tipo, cantidad, motivo, referencia_venta_id, usuario_id)
  values (
    new.id,
    coalesce(v_ctx ->> 'tipo', case when v_delta > 0 then 'entrada' else 'salida' end),
    abs(v_delta),
    coalesce(v_ctx ->> 'motivo', 'Ajuste de stock'),
    nullif(v_ctx ->> 'referencia_venta_id', '')::uuid,
    nullif(v_ctx ->> 'usuario_id', '')::uuid
  );

  return new;
end;
$$;

create trigger products_stock_movement
  after update of stock on products
  for each row execute function log_stock_movement();

-- Checkout del POS. p_items: [{"product_id": uuid, "cantidad": numeric, "precio_unitario": numeric}, ...]
-- Idempotente por client_sale_id (reintentos de red no duplican la venta).
create function process_sale(
  p_client_sale_id uuid,
  p_cajero_id uuid,
  p_items jsonb,
  p_metodo_pago text,
  p_monto_recibido numeric default null
) returns uuid
language plpgsql set search_path = public
as $$
declare
  v_sale_id uuid;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_cantidad numeric;
  v_precio numeric;
  v_product_id uuid;
  v_updated_stock numeric;
  v_cambio numeric;
begin
  select id into v_sale_id from sales where client_sale_id = p_client_sale_id;
  if v_sale_id is not null then
    return v_sale_id;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito esta vacio';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (v_item ->> 'cantidad')::numeric * (v_item ->> 'precio_unitario')::numeric;
  end loop;
  -- Redondear antes de derivar el cambio: si no, total + cambio puede no cuadrar
  -- exactamente con el monto recibido por el redondeo independiente de cada columna.
  v_subtotal := round(v_subtotal, 2);

  v_cambio := case when p_monto_recibido is not null then round(p_monto_recibido - v_subtotal, 2) else null end;

  insert into sales (client_sale_id, cajero_id, subtotal, total, metodo_pago, monto_recibido, cambio)
  values (p_client_sale_id, p_cajero_id, v_subtotal, v_subtotal, p_metodo_pago, p_monto_recibido, v_cambio)
  returning id into v_sale_id;

  perform set_config(
    'app.movement_context',
    jsonb_build_object(
      'tipo', 'salida', 'motivo', 'Venta POS', 'referencia_venta_id', v_sale_id, 'usuario_id', p_cajero_id
    )::text,
    true
  );

  -- Ordenado por product_id: si dos cajas venden productos en comun al mismo tiempo,
  -- ambas transacciones piden los locks de fila en el mismo orden y no hay deadlock.
  for v_item in select value from jsonb_array_elements(p_items) order by value ->> 'product_id' loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_cantidad := (v_item ->> 'cantidad')::numeric;
    v_precio := (v_item ->> 'precio_unitario')::numeric;

    insert into sale_items (sale_id, product_id, sku, nombre, cantidad, precio_unitario, subtotal)
    select v_sale_id, p.id, p.sku, p.nombre, v_cantidad, v_precio, v_cantidad * v_precio
    from products p where p.id = v_product_id;

    -- UPDATE condicionado: toma el lock de fila y valida stock en un solo statement.
    update products set stock = stock - v_cantidad, updated_at = now()
    where id = v_product_id and stock >= v_cantidad
    returning stock into v_updated_stock;

    if v_updated_stock is null then
      raise exception 'Stock insuficiente para el producto %', v_product_id;
    end if;
  end loop;

  return v_sale_id;
end;
$$;

-- Ajuste manual de stock (modulo de inventario). Quien puede llamarla ya se valido en
-- el servidor (solo admin); p_delta puede ser negativo.
create function adjust_stock(p_product_id uuid, p_delta numeric, p_motivo text, p_usuario_id uuid) returns numeric
language plpgsql set search_path = public
as $$
declare
  v_stock numeric;
begin
  perform set_config(
    'app.movement_context',
    jsonb_build_object(
      'tipo', 'ajuste', 'motivo', coalesce(nullif(p_motivo, ''), 'Ajuste manual'), 'usuario_id', p_usuario_id
    )::text,
    true
  );

  update products set stock = stock + p_delta, updated_at = now()
  where id = p_product_id and stock + p_delta >= 0
  returning stock into v_stock;

  if v_stock is null then
    raise exception 'El ajuste dejaria el stock en negativo';
  end if;

  return v_stock;
end;
$$;
