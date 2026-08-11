import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

const money = { type: "numeric" as const, precision: 10, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } };
const qty = { type: "numeric" as const, precision: 10, scale: 3, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } };

@Entity({ name: "sale_items" })
export class SaleItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "sale_id" })
  saleId!: string;

  @Column({ name: "product_id" })
  productId!: string;

  @Column()
  sku!: string;

  @Column()
  nombre!: string;

  @Column(qty)
  cantidad!: number;

  @Column({ name: "precio_unitario", ...money })
  precioUnitario!: number;

  @Column(money)
  subtotal!: number;
}
