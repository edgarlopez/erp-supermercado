import { Box, Typography, Divider } from "@mui/material";
import type { Sale } from "@/lib/db/entities/Sale";
import type { SaleItem } from "@/lib/db/entities/SaleItem";

export default function Ticket({ sale, items, cajeroName }: { sale: Sale; items: SaleItem[]; cajeroName: string }) {
  return (
    <Box id="ticket-print" sx={{ fontFamily: "monospace", width: 320, mx: "auto", p: 2 }}>
      <Typography align="center" variant="h6">
        Supermercado
      </Typography>
      <Typography align="center" variant="caption" component="div">
        Ticket #{sale.id.slice(0, 8).toUpperCase()}
      </Typography>
      <Typography align="center" variant="caption" component="div">
        {new Date(sale.createdAt).toLocaleString("es-MX")}
      </Typography>
      <Typography align="center" variant="caption" component="div">
        Cajero: {cajeroName}
      </Typography>
      <Divider sx={{ my: 1 }} />
      {items.map((it) => (
        <Box key={it.id} sx={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span>
            {it.cantidad} x {it.nombre}
          </span>
          <span>${it.subtotal.toFixed(2)}</span>
        </Box>
      ))}
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
        <span>Total</span>
        <span>${sale.total.toFixed(2)}</span>
      </Box>
      {sale.montoRecibido != null && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Recibido</span>
            <span>${sale.montoRecibido.toFixed(2)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Cambio</span>
            <span>${(sale.cambio ?? 0).toFixed(2)}</span>
          </Box>
        </>
      )}
      <Divider sx={{ my: 1 }} />
      <Typography align="center" variant="caption" component="div">
        Metodo: {sale.metodoPago}
      </Typography>
      <Typography align="center" variant="caption" component="div" sx={{ mt: 1 }}>
        Gracias por su compra
      </Typography>
    </Box>
  );
}
