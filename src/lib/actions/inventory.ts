"use server";

import { requireAdmin } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { Product } from "@/lib/db/entities/Product";
import type { Unidad } from "@/lib/types";

export interface ImportRow {
  sku: string;
  producto: string;
  categoria: string;
  unidad: string;
  precio: string;
  stock: string;
}

const VALID_UNIDADES = new Set<Unidad>(["pieza", "kg", "paquete", "manojo"]);

export async function importProducts(rows: ImportRow[]): Promise<{ count: number }> {
  await requireAdmin();

  const db = await getDataSource();
  const values = rows
    .map((r) => ({
      sku: r.sku.trim(),
      nombre: r.producto.trim(),
      categoria: r.categoria.trim(),
      unidad: r.unidad.trim().toLowerCase() as Unidad,
      precio: Number(r.precio),
      stock: Number(r.stock),
    }))
    .filter((r) => r.sku && r.nombre && VALID_UNIDADES.has(r.unidad) && !Number.isNaN(r.precio) && !Number.isNaN(r.stock))
    .map((r) => ({ ...r, stockMinimo: Math.max(5, Math.round(r.stock * 0.15)) }));

  if (values.length === 0) {
    throw new Error("El CSV no tiene filas validas (columnas esperadas: sku, producto, categoria, unidad, precio, stock)");
  }

  await db
    .createQueryBuilder()
    .insert()
    .into(Product)
    .values(values)
    .orUpdate(["nombre", "categoria", "unidad", "precio", "stock", "stock_minimo", "updated_at"], ["sku"])
    .updateEntity(false)
    .execute();

  return { count: values.length };
}

export async function adjustStock(productId: string, delta: number, motivo: string): Promise<number> {
  const user = await requireAdmin();
  const db = await getDataSource();

  const rows: { adjust_stock: string }[] = await db.query("select adjust_stock($1, $2, $3, $4) as adjust_stock", [
    productId,
    delta,
    motivo,
    user.id,
  ]);

  return Number(rows[0].adjust_stock);
}

export interface ProductPatch {
  nombre?: string;
  categoria?: string;
  precio?: number;
  stockMinimo?: number;
}

export async function updateProduct(productId: string, patch: ProductPatch): Promise<void> {
  await requireAdmin();
  const db = await getDataSource();
  await db.getRepository(Product).update({ id: productId }, patch);
}
