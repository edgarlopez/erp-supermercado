"use server";

import { requireAdmin } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { Expense } from "@/lib/db/entities/Expense";
import type { CategoriaGasto } from "@/lib/types";

export interface ExpenseInput {
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  fecha: string;
}

export async function registerExpense(input: ExpenseInput): Promise<void> {
  const user = await requireAdmin();
  const db = await getDataSource();
  await db.getRepository(Expense).insert({ ...input, usuarioId: user.id });
}
