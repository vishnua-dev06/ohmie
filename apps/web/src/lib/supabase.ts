import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
export const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = (await supabase?.auth.getSession())?.data.session;
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error ?? 'The request could not be completed.');
  return payload as T;
}

export type Pet = {
  id: string;
  name: string;
  happiness: number;
  energy: number;
  friendship: number;
  experience: number;
  level: number;
  emotion: Emotion;
  sleep_status: boolean;
  updated_at?: string;
};
export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'sleeping' | 'excited' | 'tired' | 'lonely' | 'curious';
export type PetAction = 'pet' | 'feed' | 'play' | 'talk' | 'sleep' | 'wake' | 'reward' | 'daily_reward';
export type Task = { id: string; title: string; description: string; priority: 'low' | 'medium' | 'high'; due_date?: string | null; completed: boolean; completed_at?: string | null; created_at: string };
export type Mood = { id: string; mood: 'happy' | 'sad' | 'angry' | 'tired' | 'stressed' | 'excited'; journal: string; created_at: string };

