import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ─── WebSocket ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebSocketImpl: typeof WebSocket =
  typeof globalThis.WebSocket !== 'undefined'
    ? globalThis.WebSocket
    : require('ws');

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_ANON_KEY_HERE';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
  realtime: {
    // Explicit WebSocket class — fixes "WebSocket is not defined" in
    // environments where the global isn't set (Metro/Node test runners).
    transport: WebSocketImpl,
    params: { eventsPerSecond: 10 },
  },
});

export function isSupabaseConfigured(): boolean {
  return (
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')
  );
}
