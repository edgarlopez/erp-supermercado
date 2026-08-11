import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AppShell from "@/components/nav/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      {children}
    </AppShell>
  );
}
