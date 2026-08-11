"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Paper, TextField, Button, Typography, Tabs, Tab, Alert } from "@mui/material";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (tab === "login") {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError("Correo o contrasena incorrectos");
        return;
      }
      router.push("/pos");
      router.refresh();
    } else {
      const { error } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setInfo("Cuenta creada como cajero. Pide a un administrador que te de acceso si necesitas mas permisos, e inicia sesion.");
      setTab("login");
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.100" }}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
          ERP Supermercado
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="fullWidth">
          <Tab label="Entrar" value="login" />
          <Tab label="Crear cuenta" value="signup" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tab === "signup" && (
            <TextField label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth />
          )}
          <TextField label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            slotProps={{ htmlInput: { minLength: 6 } }}
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {tab === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
