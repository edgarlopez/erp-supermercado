import { Table, TableHead, TableBody, TableRow, TableCell, Chip } from "@mui/material";
import type { Expense } from "@/lib/db/entities/Expense";

export default function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Fecha</TableCell>
          <TableCell>Concepto</TableCell>
          <TableCell>Categoria</TableCell>
          <TableCell align="right">Monto</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {expenses.map((e) => (
          <TableRow key={e.id} hover>
            <TableCell>{e.fecha}</TableCell>
            <TableCell>{e.concepto}</TableCell>
            <TableCell>
              <Chip size="small" label={e.categoria} />
            </TableCell>
            <TableCell align="right">${e.monto.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
