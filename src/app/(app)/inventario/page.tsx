import { Typography } from "@mui/material";
import { getDataSource } from "@/lib/db/data-source";
import { Product } from "@/lib/db/entities/Product";
import { toPlain } from "@/lib/db/plain";
import { requireUser } from "@/lib/auth/session";
import ProductTable from "@/components/inventario/ProductTable";

export default async function InventarioPage() {
  const user = await requireUser();
  const db = await getDataSource();
  const products = await db.getRepository(Product).find({ order: { categoria: "ASC", nombre: "ASC" } });

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Inventario
      </Typography>
      <ProductTable products={toPlain(products)} role={user.role} />
    </>
  );
}
