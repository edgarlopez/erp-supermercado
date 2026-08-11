"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, TextField, MenuItem, Button, Alert, Typography } from "@mui/material";
import { registerExpense } from "@/lib/actions/finance";
import type { CategoriaGasto } from "@/lib/types";

const CATEGORIAS: { value: CategoriaGasto; label: string }[] = [
  { value: "renta", label: "Renta" },
  { value: "electricidad", label: "Electricidad" },
  { value: "proveedores", label: "Proveedores" },
  { value: "otros", label: "Otros" },
];

export default function ExpenseForm() {
  const router = useRouter();
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("otros");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerExpense({ concepto, categoria, monto: Number(monto), fecha });
      setConcepto("");
      setMonto("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el gasto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      <Typography variant="subtitle1">Registrar gasto</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} required fullWidth />
      <TextField select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)} fullWidth>
        {CATEGORIAS.map((c) => (
          <MenuItem key={c.value} value={c.value}>
            {c.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField label="Monto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required fullWidth />
      <TextField
        label="Fecha"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        required
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? "Guardando..." : "Registrar"}
      </Button>
    </Stack>
  );
}
