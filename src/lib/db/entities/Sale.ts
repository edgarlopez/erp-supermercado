import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { MetodoPago } from "@/lib/types";

const money = { type: "numeric" as const, precision: 10, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } };

@Entity({ name: "sales" })
export class Sale {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "client_sale_id" })
  clientSaleId!: string;

  @Column({ name: "cajero_id" })
  cajeroId!: string;

  @Column(money)
  subtotal!: number;

  @Column(money)
  total!: number;

  @Column({ name: "metodo_pago" })
  metodoPago!: MetodoPago;

  @Column({ name: "monto_recibido", ...money, nullable: true })
  montoRecibido!: number | null;

  @Column({ ...money, nullable: true })
  cambio!: number | null;

  @Column({ name: "created_at" })
  createdAt!: Date;
}
