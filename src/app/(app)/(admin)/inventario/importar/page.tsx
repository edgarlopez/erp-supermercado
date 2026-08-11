"use client";

import { useState } from "react";
import { Typography, Button, Box, Alert, Paper, Stack } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Papa from "papaparse";
import { importProducts, type ImportRow } from "@/lib/actions/inventory";

export default function ImportarPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);

    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      encoding: "utf-8",
      complete: (res) => setRows(res.data),
      error: (err) => setError(err.message),
    });
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    try {
      const { count } = await importProducts(rows);
      setResult(`Se importaron/actualizaron ${count} productos.`);
      setRows([]);
      setFileName(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar el CSV");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Importar catalogo (CSV)
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Columnas esperadas: sku, producto, categoria, unidad, precio, stock. Los productos existentes (mismo SKU) se
            actualizan; los nuevos se agregan.
          </Typography>

          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
            {fileName ?? "Seleccionar archivo CSV"}
            <input type="file" accept=".csv" hidden onChange={handleFile} />
          </Button>

          {rows.length > 0 && <Alert severity="info">{rows.length} filas listas para importar.</Alert>}
          {result && <Alert severity="success">{result}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <Button variant="contained" disabled={rows.length === 0 || loading} onClick={handleImport}>
            {loading ? "Importando..." : "Importar"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
