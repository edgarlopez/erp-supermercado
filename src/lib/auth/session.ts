import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { getDataSource } from "@/lib/db/data-source";
import { Profile } from "@/lib/db/entities/Profile";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  role: "admin" | "cajero";
}

// Fuente de identidad: sesion de Supabase Auth. Fuente de rol/perfil: tabla `profiles`
// via TypeORM (ya no via RLS). Devuelve null si no hay sesion o el perfil aun no existe.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const db = await getDataSource();
  const profile = await db.getRepository(Profile).findOneBy({ id: user.id });

  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, fullName: profile.fullName, role: profile.role };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("No autorizado");
  return user;
}
