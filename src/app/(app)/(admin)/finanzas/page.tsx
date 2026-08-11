import { Typography, Grid, Paper, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { getDataSource } from "@/lib/db/data-source";
import CashFlowChart, { type CashFlowDay } from "@/components/finanzas/CashFlowChart";

interface Summary {
  hoy: string;
  semana: string;
  mes: string;
  ventas_hoy: string;
}

interface TopProduct {
  sku: string;
  nombre: string;
  cantidad: string;
  total: string;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </Paper>
  );
}

export default async function FinanzasPage() {
  const db = await getDataSource();

  const [summary]: Summary[] = await db.query(`
    select
      coalesce(sum(total) filter (where created_at >= date_trunc('day', now())), 0) as hoy,
      coalesce(sum(total) filter (where created_at >= date_trunc('week', now())), 0) as semana,
      coalesce(sum(total) filter (where created_at >= date_trunc('month', now())), 0) as mes,
      count(*) filter (where created_at >= date_trunc('day', now())) as ventas_hoy
    from sales
  `);

  const cashFlow: CashFlowDay[] = await db.query(`
    select
      d::date as dia,
      coalesce((select sum(total) from sales where created_at::date = d::date), 0) as ingresos,
      coalesce((select sum(monto) from expenses where fecha = d::date), 0) as egresos
    from generate_series(current_date - interval '6 days', current_date, interval '1 day') d
    order by d
  `);

  const topProducts: TopProduct[] = await db.query(`
    select si.sku, si.nombre, sum(si.cantidad) as cantidad, sum(si.subtotal) as total
    from sale_items si
    join sales s on s.id = si.sale_id
    where s.created_at >= now() - interval '30 days'
    group by si.sku, si.nombre
    order by sum(si.cantidad) desc
    limit 5
  `);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Finanzas
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label={`Ventas hoy (${summary.ventas_hoy})`} value={`$${Number(summary.hoy).toFixed(2)}`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Ventas esta semana" value={`$${Number(summary.semana).toFixed(2)}`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Ventas este mes" value={`$${Number(summary.mes).toFixed(2)}`} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Flujo de caja (ultimos 7 dias)
            </Typography>
            <CashFlowChart data={cashFlow.map((d) => ({ dia: d.dia, ingresos: Number(d.ingresos), egresos: Number(d.egresos) }))} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Top productos (30 dias)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell align="right">{Number(p.cantidad)}</TableCell>
                    <TableCell align="right">${Number(p.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
