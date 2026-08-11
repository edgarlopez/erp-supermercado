"use server";

import { requireUser } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { Sale } from "@/lib/db/entities/Sale";
import { SaleItem } from "@/lib/db/entities/SaleItem";
import type { MetodoPago } from "@/lib/types";

export interface CheckoutItem {
  productId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CheckoutInput {
  clientSaleId: string;
  items: CheckoutItem[];
  metodoPago: MetodoPago;
  montoRecibido: number | null;
}

export interface CheckoutResult {
  sale: Sale;
  items: SaleItem[];
  cajeroName: string;
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const user = await requireUser();

  if (input.items.length === 0) {
    throw new Error("El carrito esta vacio");
  }

  const db = await getDataSource();
  const payload = input.items.map((i) => ({
    product_id: i.productId,
    cantidad: i.cantidad,
    precio_unitario: i.precioUnitario,
  }));

  const rows: { process_sale: string }[] = await db.query(
    "select process_sale($1, $2, $3, $4, $5) as process_sale",
    [input.clientSaleId, user.id, JSON.stringify(payload), input.metodoPago, input.montoRecibido],
  );
  const saleId = rows[0].process_sale;

  const sale = await db.getRepository(Sale).findOneByOrFail({ id: saleId });
  const items = await db.getRepository(SaleItem).findBy({ saleId });

  return { sale, items, cajeroName: user.fullName || user.email || "" };
}
