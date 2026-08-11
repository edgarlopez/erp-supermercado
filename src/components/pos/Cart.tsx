"use client";

import { Box, List, ListItem, ListItemText, IconButton, Typography, Divider, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import type { Product } from "@/lib/db/entities/Product";

export interface CartLine {
  product: Product;
  cantidad: number;
}

export default function Cart({
  lines,
  onChangeCantidad,
  onRemove,
  onCheckout,
}: {
  lines: CartLine[];
  onChangeCantidad: (productId: string, cantidad: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}) {
  const total = lines.reduce((sum, l) => sum + l.product.precio * l.cantidad, 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6">Carrito</Typography>
      <List sx={{ flexGrow: 1, overflowY: "auto" }}>
        {lines.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Sin productos todavia
          </Typography>
        )}
        {lines.map((l) => (
          <ListItem
            key={l.product.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => onRemove(l.product.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText
              primary={l.product.nombre}
              secondary={
                l.product.unidad === "kg"
                  ? `${l.cantidad} kg x $${l.product.precio.toFixed(2)}`
                  : `$${l.product.precio.toFixed(2)} c/u`
              }
            />
            {l.product.unidad !== "kg" && (
              <Box sx={{ display: "flex", alignItems: "center", mr: 4 }}>
                <IconButton size="small" onClick={() => onChangeCantidad(l.product.id, l.cantidad - 1)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ mx: 1 }}>{l.cantidad}</Typography>
                <IconButton size="small" onClick={() => onChangeCantidad(l.product.id, l.cantidad + 1)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Typography sx={{ minWidth: 70, textAlign: "right" }}>${(l.product.precio * l.cantidad).toFixed(2)}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ display: "flex", justifyContent: "space-between", py: 2 }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6">${total.toFixed(2)}</Typography>
      </Box>
      <Button variant="contained" size="large" fullWidth disabled={lines.length === 0} onClick={onCheckout}>
        Cobrar
      </Button>
    </Box>
  );
}
