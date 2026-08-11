"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Box,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import TuneIcon from "@mui/icons-material/Tune";
import type { Product } from "@/lib/db/entities/Product";
import type { Role } from "@/lib/types";
import { adjustStock, updateProduct } from "@/lib/actions/inventory";

export default function ProductTable({ products, role }: { products: Product[]; role: Role }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = role === "admin";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Buscar por nombre o SKU..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>SKU</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Unidad</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="right">Stock</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((p) => {
            const lowStock = p.stock <= p.stockMinimo;
            return (
              <TableRow key={p.id} hover>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{p.nombre}</TableCell>
                <TableCell>{p.categoria}</TableCell>
                <TableCell>{p.unidad}</TableCell>
                <TableCell align="right">${p.precio.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Chip size="small" label={p.stock} color={lowStock ? "error" : "default"} variant={lowStock ? "filled" : "outlined"} />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditing(p)} title="Editar">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setAdjusting(p)} title="Ajustar stock">
                      <TuneIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editing && (
        <EditDialog
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            startTransition(async () => {
              try {
                await updateProduct(editing.id, patch);
                setEditing(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo guardar");
              }
            });
          }}
          loading={isPending}
        />
      )}

      {adjusting && (
        <AdjustDialog
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSave={(delta, motivo) => {
            startTransition(async () => {
              try {
                await adjustStock(adjusting.id, delta, motivo);
                setAdjusting(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo ajustar el stock");
              }
            });
          }}
          loading={isPending}
        />
      )}

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function EditDialog({
  product,
  onClose,
  onSave,
  loading,
}: {
  product: Product;
  onClose: () => void;
  onSave: (patch: { nombre: string; categoria: string; precio: number; stockMinimo: number }) => void;
  loading: boolean;
}) {
  const [nombre, setNombre] = useState(product.nombre);
  const [categoria, setCategoria] = useState(product.categoria);
  const [precio, setPrecio] = useState(String(product.precio));
  const [stockMinimo, setStockMinimo] = useState(String(product.stockMinimo));

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar {product.sku}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth />
          <TextField label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} fullWidth />
          <TextField label="Precio" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} fullWidth />
          <TextField
            label="Stock minimo (alerta)"
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={() => onSave({ nombre, categoria, precio: Number(precio), stockMinimo: Number(stockMinimo) })}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AdjustDialog({
  product,
  onClose,
  onSave,
  loading,
}: {
  product: Product;
  onClose: () => void;
  onSave: (delta: number, motivo: string) => void;
  loading: boolean;
}) {
  const [delta, setDelta] = useState("");
  const [motivo, setMotivo] = useState("");

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Ajustar stock de {product.nombre}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label={`Stock actual: ${product.stock}`} disabled fullWidth />
          <TextField
            label="Cantidad (+ entrada, - salida)"
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" disabled={loading || !delta} onClick={() => onSave(Number(delta), motivo)}>
          Ajustar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
