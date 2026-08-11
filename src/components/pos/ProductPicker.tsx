"use client";

import { useMemo, useState } from "react";
import {
  Box,
  TextField,
  Tabs,
  Tab,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
} from "@mui/material";
import type { Product } from "@/lib/db/entities/Product";

export default function ProductPicker({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd: (product: Product, cantidad: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [weightInput, setWeightInput] = useState("");

  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(products.map((p) => p.categoria)))], [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategoria = categoria === "Todas" || p.categoria === categoria;
      const matchesQuery = !q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchesCategoria && matchesQuery;
    });
  }, [products, query, categoria]);

  function handleClick(product: Product) {
    if (product.unidad === "kg") {
      setWeightProduct(product);
      setWeightInput("");
      return;
    }
    onAdd(product, 1);
  }

  function confirmWeight() {
    const cantidad = Number(weightInput);
    if (weightProduct && cantidad > 0) {
      onAdd(weightProduct, cantidad);
    }
    setWeightProduct(null);
  }

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Buscar por nombre o SKU..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        sx={{ mb: 1 }}
      />

      <Tabs value={categoria} onChange={(_, v) => setCategoria(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {categorias.map((c) => (
          <Tab key={c} value={c} label={c} />
        ))}
      </Tabs>

      <Grid container spacing={1.5} sx={{ maxHeight: "60vh", overflowY: "auto" }}>
        {filtered.map((p) => {
          const lowStock = p.stock <= p.stockMinimo;
          return (
            <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card variant="outlined">
                <CardActionArea onClick={() => handleClick(p)} disabled={p.stock <= 0}>
                  <CardContent>
                    <Typography variant="subtitle2" noWrap title={p.nombre}>
                      {p.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.sku} · {p.unidad}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      ${p.precio.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color={lowStock ? "error" : "text.secondary"}>
                      Stock: {p.stock}
                      {p.stock <= 0 ? " (agotado)" : lowStock ? " (bajo)" : ""}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={!!weightProduct} onClose={() => setWeightProduct(null)}>
        <DialogTitle>{weightProduct?.nombre}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            type="number"
            label="Peso"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            slotProps={{ htmlInput: { step: 0.01, min: 0 }, input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
            onKeyDown={(e) => e.key === "Enter" && confirmWeight()}
            sx={{ mt: 1 }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeightProduct(null)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmWeight}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
