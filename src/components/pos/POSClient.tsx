"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Grid, Paper, Dialog, DialogContent, DialogActions, Button, Alert, Snackbar } from "@mui/material";
import ProductPicker from "./ProductPicker";
import Cart, { type CartLine } from "./Cart";
import PaymentDialog from "./PaymentDialog";
import Ticket from "./Ticket";
import { checkout, type CheckoutResult } from "@/lib/actions/pos";
import type { Product } from "@/lib/db/entities/Product";
import type { MetodoPago } from "@/lib/types";

export default function POSClient({ products: initialProducts }: { products: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [paying, setPaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CheckoutResult | null>(null);

  function addToCart(product: Product, cantidad: number) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, cantidad: l.cantidad + cantidad } : l));
      }
      return [...prev, { product, cantidad }];
    });
  }

  function changeCantidad(productId: string, cantidad: number) {
    if (cantidad <= 0) {
      removeLine(productId);
      return;
    }
    setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, cantidad } : l)));
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const total = lines.reduce((sum, l) => sum + l.product.precio * l.cantidad, 0);

  async function handleConfirmPayment(metodoPago: MetodoPago, montoRecibido: number | null) {
    setProcessing(true);
    setError(null);
    try {
      const result = await checkout({
        clientSaleId: crypto.randomUUID(),
        metodoPago,
        montoRecibido,
        items: lines.map((l) => ({ productId: l.product.id, cantidad: l.cantidad, precioUnitario: l.product.precio })),
      });

      setProducts((prev) =>
        prev.map((p) => {
          const sold = lines.find((l) => l.product.id === p.id);
          return sold ? { ...p, stock: p.stock - sold.cantidad } : p;
        }),
      );
      setLines([]);
      setPaying(false);
      setReceipt(result);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la venta");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <Grid container spacing={2} sx={{ height: "calc(100vh - 140px)" }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ProductPicker products={products} onAdd={addToCart} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Cart lines={lines} onChangeCantidad={changeCantidad} onRemove={removeLine} onCheckout={() => setPaying(true)} />
          </Paper>
        </Grid>
      </Grid>

      <PaymentDialog
        open={paying}
        total={total}
        loading={processing}
        onClose={() => setPaying(false)}
        onConfirm={handleConfirmPayment}
      />

      <Dialog open={!!receipt} onClose={() => setReceipt(null)} maxWidth="xs" fullWidth>
        <DialogContent>
          {receipt && <Ticket sale={receipt.sale} items={receipt.items} cajeroName={receipt.cajeroName} />}
        </DialogContent>
        <DialogActions sx={{ "@media print": { display: "none" } }}>
          <Button onClick={() => setReceipt(null)}>Cerrar</Button>
          <Button variant="contained" onClick={() => window.print()}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
