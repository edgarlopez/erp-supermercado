import { Typography, Grid, Paper } from "@mui/material";
import { getDataSource } from "@/lib/db/data-source";
import { Expense } from "@/lib/db/entities/Expense";
import ExpenseForm from "@/components/finanzas/ExpenseForm";
import ExpenseTable from "@/components/finanzas/ExpenseTable";

export default async function GastosPage() {
  const db = await getDataSource();
  const expenses = await db.getRepository(Expense).find({ order: { fecha: "DESC", createdAt: "DESC" }, take: 100 });

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Gastos
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <ExpenseForm />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <ExpenseTable expenses={expenses} />
        </Grid>
      </Grid>
    </>
  );
}
