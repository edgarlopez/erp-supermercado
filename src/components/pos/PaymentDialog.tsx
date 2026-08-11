"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, Box, Alert } from "@mui/material";
import type { MetodoPago } from "@/lib/types";

export default function PaymentDialog({
  open,
  total,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  total: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (metodoPago: MetodoPago, montoRecibido: number | null) => void;
}) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");

  const cambio = useMemo(() => {
    const recibido = Number(montoRecibido);
    if (!montoRecibido || Number.isNaN(recibido)) return null;
    return recibido - total;
  }, [montoRecibido, total]);

  const canConfirm = metodoPago !== "efectivo" || (cambio !== null && cambio >= 0);

  function handleConfirm() {
    onConfirm(metodoPago, metodoPago === "efectivo" ? Number(montoRecibido) : null);
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Cobrar</DialogTitle>
      <DialogContent>
        <Typography variant="h4" sx={{ mb: 2 }}>
          ${total.toFixed(2)}
        </Typography>

        <TextField
          select
          fullWidth
          label="Metodo de pago"
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="efectivo">Efectivo</MenuItem>
          <MenuItem value="tarjeta">Tarjeta</MenuItem>
          <MenuItem value="transferencia">Transferencia</MenuItem>
        </TextField>

        {metodoPago === "efectivo" && (
          <Box>
            <TextField
              fullWidth
              autoFocus
              type="number"
              label="Monto recibido"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              slotProps={{ htmlInput: { step: 0.5, min: 0 } }}
            />
            {cambio !== null && (
              <Alert severity={cambio >= 0 ? "success" : "error"} sx={{ mt: 2 }}>
                {cambio >= 0 ? `Cambio: $${cambio.toFixed(2)}` : "Monto insuficiente"}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!canConfirm || loading}>
          {loading ? "Procesando..." : "Confirmar cobro"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
