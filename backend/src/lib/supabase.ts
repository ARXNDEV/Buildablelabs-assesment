import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from '../config/env.js';

// supabase-js eagerly constructs a realtime client that expects a global
// WebSocket. Node < 22 has none, so provide one. (We don't use realtime, but
// the client is built at createClient() time regardless.)
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

/**
 * Single shared Supabase client using the service-role key.
 *
 * This runs server-side only. The service-role key bypasses Row Level Security,
 * which is exactly why the mobile app must never hold it — the API is the sole
 * gatekeeper to the database.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const TASKS_TABLE = 'tasks';
