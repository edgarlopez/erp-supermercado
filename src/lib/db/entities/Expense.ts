import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { CategoriaGasto } from "@/lib/types";

@Entity({ name: "expenses" })
export class Expense {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  concepto!: string;

  @Column({ type: "varchar" })
  categoria!: CategoriaGasto;

  @Column({ type: "numeric", precision: 10, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  monto!: number;

  @Column({ type: "date" })
  fecha!: string;

  @Column({ name: "usuario_id", type: "uuid", nullable: true })
  usuarioId!: string | null;

  @Column({ name: "created_at" })
  createdAt!: Date;
}
