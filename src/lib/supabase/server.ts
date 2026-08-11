import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Debe crearse por request (lleva las cookies de esa request), nunca como singleton.
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Se llama desde un Server Component; el middleware ya refresca la sesion.
        }
      },
    },
  });
}
