import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { TipoMovimiento } from "@/lib/types";

@Entity({ name: "inventory_movements" })
export class InventoryMovement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "product_id" })
  productId!: string;

  @Column({ type: "varchar" })
  tipo!: TipoMovimiento;

  @Column({ type: "numeric", precision: 10, scale: 3, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  cantidad!: number;

  @Column({ default: "" })
  motivo!: string;

  @Column({ name: "referencia_venta_id", type: "uuid", nullable: true })
  referenciaVentaId!: string | null;

  @Column({ name: "usuario_id", type: "uuid", nullable: true })
  usuarioId!: string | null;

  @Column({ name: "created_at" })
  createdAt!: Date;
}
