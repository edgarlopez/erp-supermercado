import { getDataSource } from "@/lib/db/data-source";
import { Product } from "@/lib/db/entities/Product";
import POSClient from "@/components/pos/POSClient";

export default async function POSPage() {
  const db = await getDataSource();
  const products = await db.getRepository(Product).find({ order: { categoria: "ASC", nombre: "ASC" } });

  return <POSClient products={products} />;
}
