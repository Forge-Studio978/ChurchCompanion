import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabasePromise: Promise<SupabaseClient> | null = null;

async function initSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;
  
  const response = await fetch('/api/config/supabase');
  const { url, anonKey } = await response.json();
  
  if (!url || !anonKey) {
    throw new Error('Failed to fetch Supabase configuration');
  }
  
  supabaseInstance = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  
  return supabaseInstance;
}

export function getSupabase(): Promise<SupabaseClient> {
  if (!supabasePromise) {
    supabasePromise = initSupabase();
  }
  return supabasePromise;
}

export { supabaseInstance as supabase };
