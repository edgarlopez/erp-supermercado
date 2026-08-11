import { Typography } from "@mui/material";
import { getDataSource } from "@/lib/db/data-source";
import { requireAdmin } from "@/lib/auth/session";
import UserTable, { type UserRow } from "@/components/usuarios/UserTable";

export default async function UsuariosPage() {
  const currentUser = await requireAdmin();
  const db = await getDataSource();

  const users: UserRow[] = await db.query(`
    select p.id, p.full_name as "fullName", p.role, u.email
    from profiles p
    join auth.users u on u.id = p.id
    order by u.email
  `);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Usuarios
      </Typography>
      <UserTable users={users} currentUserId={currentUser.id} />
    </>
  );
}
