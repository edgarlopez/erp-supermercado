"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHead, TableBody, TableRow, TableCell, Select, MenuItem, Alert } from "@mui/material";
import { updateRole } from "@/lib/actions/users";
import type { Role } from "@/lib/types";

export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export default function UserTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(id: string, role: Role) {
    startTransition(async () => {
      await updateRole(id, role);
      router.refresh();
    });
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Correo</TableCell>
            <TableCell align="right">Rol</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} hover>
              <TableCell>{u.fullName || "-"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell align="right">
                <Select
                  size="small"
                  value={u.role}
                  disabled={isPending || u.id === currentUserId}
                  onChange={(e) => handleChange(u.id, e.target.value as Role)}
                >
                  <MenuItem value="cajero">Cajero</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Alert severity="info" sx={{ mt: 2 }}>
        No puedes cambiar tu propio rol (evita quedarte sin acceso de administrador por accidente).
      </Alert>
    </>
  );
}
