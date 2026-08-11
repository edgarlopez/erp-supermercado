import { Typography, Table, TableHead, TableBody, TableRow, TableCell, Chip } from "@mui/material";
import { getDataSource } from "@/lib/db/data-source";
import type { TipoMovimiento } from "@/lib/types";

interface MovementRow {
  id: string;
  tipo: TipoMovimiento;
  cantidad: string;
  motivo: string;
  created_at: string;
  sku: string;
  producto_nombre: string;
  usuario_nombre: string | null;
}

const COLOR: Record<TipoMovimiento, "success" | "warning" | "info"> = {
  entrada: "success",
  salida: "warning",
  ajuste: "info",
};

export default async function MovimientosPage() {
  const db = await getDataSource();
  const rows: MovementRow[] = await db.query(`
    select m.id, m.tipo, m.cantidad, m.motivo, m.created_at, p.sku, p.nombre as producto_nombre, pr.full_name as usuario_nombre
    from inventory_movements m
    join products p on p.id = m.product_id
    left join profiles pr on pr.id = m.usuario_id
    order by m.created_at desc
    limit 200
  `);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Movimientos de inventario
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Cantidad</TableCell>
            <TableCell>Motivo</TableCell>
            <TableCell>Usuario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{new Date(r.created_at).toLocaleString("es-MX")}</TableCell>
              <TableCell>
                {r.sku} - {r.producto_nombre}
              </TableCell>
              <TableCell>
                <Chip size="small" label={r.tipo} color={COLOR[r.tipo]} />
              </TableCell>
              <TableCell align="right">{Number(r.cantidad)}</TableCell>
              <TableCell>{r.motivo}</TableCell>
              <TableCell>{r.usuario_nombre ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
