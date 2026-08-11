"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleIcon from "@mui/icons-material/People";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LogoutIcon from "@mui/icons-material/Logout";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

const DRAWER_WIDTH = 240;

const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { href: "/pos", label: "Punto de venta", icon: <PointOfSaleIcon /> },
  { href: "/inventario", label: "Inventario", icon: <Inventory2Icon /> },
  { href: "/inventario/movimientos", label: "Movimientos", icon: <SwapHorizIcon /> },
  { href: "/finanzas", label: "Finanzas", icon: <AttachMoneyIcon />, adminOnly: true },
  { href: "/finanzas/gastos", label: "Gastos", icon: <ReceiptLongIcon />, adminOnly: true },
  { href: "/inventario/importar", label: "Importar CSV", icon: <UploadFileIcon />, adminOnly: true },
  { href: "/usuarios", label: "Usuarios", icon: <PeopleIcon />, adminOnly: true },
];

export default function AppShell({
  fullName,
  role,
  children,
}: {
  fullName: string;
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isSmall = useMediaQuery("(max-width:900px)");
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const drawerContent = (
    <List>
      {items.map((item) => (
        <ListItemButton key={item.href} component={Link} href={item.href} onClick={() => setOpen(false)}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
      <ListItemButton onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Cerrar sesion" />
      </ListItemButton>
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          {isSmall && (
            <IconButton color="inherit" edge="start" onClick={() => setOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ERP Supermercado
          </Typography>
          <Typography variant="body2">{fullName || "Usuario"}</Typography>
          <Chip
            size="small"
            label={role === "admin" ? "Administrador" : "Cajero"}
            color={role === "admin" ? "secondary" : "default"}
          />
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isSmall ? "temporary" : "permanent"}
        open={isSmall ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
