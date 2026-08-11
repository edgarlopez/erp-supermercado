import { Column, Entity, PrimaryColumn } from "typeorm";
import type { Role } from "@/lib/types";

@Entity({ name: "profiles" })
export class Profile {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "full_name", default: "" })
  fullName!: string;

  @Column({ type: "varchar", default: "cajero" })
  role!: Role;

  @Column({ name: "created_at" })
  createdAt!: Date;
}
