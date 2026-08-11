"use server";

import { requireAdmin } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { Profile } from "@/lib/db/entities/Profile";
import type { Role } from "@/lib/types";

export async function updateRole(profileId: string, role: Role): Promise<void> {
  const admin = await requireAdmin();
  if (profileId === admin.id) {
    throw new Error("No puedes cambiar tu propio rol");
  }
  const db = await getDataSource();
  await db.getRepository(Profile).update({ id: profileId }, { role });
}
