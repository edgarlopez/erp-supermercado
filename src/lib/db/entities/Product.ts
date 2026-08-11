import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import type { Unidad } from "@/lib/types";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  sku!: string;

  @Column()
  nombre!: string;

  @Column()
  categoria!: string;

  @Column({ type: "varchar" })
  unidad!: Unidad;

  @Column({ type: "numeric", precision: 10, scale: 2, transformer: { to: (v) => v, from: (v) => Number(v) } })
  precio!: number;

  @Column({ type: "numeric", precision: 10, scale: 3, transformer: { to: (v) => v, from: (v) => Number(v) } })
  stock!: number;

  @Column({
    name: "stock_minimo",
    type: "numeric",
    precision: 10,
    scale: 3,
    transformer: { to: (v) => v, from: (v) => Number(v) },
  })
  stockMinimo!: number;

  @Column({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: "updated_at" })
  updatedAt!: Date;
}
