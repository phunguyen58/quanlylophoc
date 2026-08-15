/**
 * Browser Supabase client. Reserved for future client-side data access if needed.
 * All current mutations use Server Actions; pages load data via Server Components.
 */
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const { publishableKey, url } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
