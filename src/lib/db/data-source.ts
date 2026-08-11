import "reflect-metadata";
import "server-only";
// TypeORM loads the "pg" driver via a dynamic require() (a runtime string,
// not a static import), so Vercel's file tracer can't see it and drops it
// from the serverless bundle. A plain static import forces it to be traced.
import "pg";
import { DataSource } from "typeorm";
import { Profile } from "./entities/Profile";
import { Product } from "./entities/Product";
import { Sale } from "./entities/Sale";
import { SaleItem } from "./entities/SaleItem";
import { InventoryMovement } from "./entities/InventoryMovement";
import { Expense } from "./entities/Expense";
import { WhatsappConversation } from "./entities/WhatsappConversation";

const globalForDataSource = globalThis as unknown as { dataSource?: DataSource };

const dataSource =
  globalForDataSource.dataSource ??
  new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Profile, Product, Sale, SaleItem, InventoryMovement, Expense, WhatsappConversation],
    synchronize: false,
    poolSize: 5,
    ssl: { rejectUnauthorized: false },
  });

// El schema ya vive en supabase/migrations/*.sql (se pegan en el SQL editor de
// Supabase); TypeORM solo mapea entidades, nunca corre synchronize en produccion.
if (process.env.NODE_ENV !== "production") {
  globalForDataSource.dataSource = dataSource;
}

let initPromise: Promise<DataSource> | null = null;

export function getDataSource(): Promise<DataSource> {
  if (dataSource.isInitialized) {
    return Promise.resolve(dataSource);
  }
  if (!initPromise) {
    initPromise = dataSource.initialize();
  }
  return initPromise;
}
