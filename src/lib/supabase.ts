import { createClient } from '@supabase/supabase-js';

// Access Supabase credentials securely from import.meta.env
// @ts-ignore
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Dynamic feature flag to check configuration status
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are not configured. The app will dynamically fall back to the Facebook profile logo.'
  );
}

// Create client instance safely
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to get the correct logo URL.
 * It prioritizes VITE_LOGO_STORAGE_URL environment override,
 * then checks Supabase storage logic, and falls back to RTFT's real Facebook page profile picture.
 */
export function getRtftLogoUrl(bucketName: string = 'assets', fileName: string = 'rtft-logo.png'): string {
  // @ts-ignore
  const currentEnv = (import.meta as any).env || {};
  const logoOverride = currentEnv.VITE_LOGO_STORAGE_URL;
  if (logoOverride) {
    return logoOverride;
  }

  if (supabase && isSupabaseConfigured) {
    try {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      console.error('Supabase storage public URL generation failed:', error);
    }
  }

  // Reliable, real-time fallback to RTFT's live page logo
  return 'https://graph.facebook.com/100084050294833/picture?type=large'; // FB ID node profile photo redirect
}
