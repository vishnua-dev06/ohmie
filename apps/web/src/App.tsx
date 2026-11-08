import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AppContext } from './lib/context';
import { apiBase, apiRequest, isSupabaseConfigured, supabase, type Pet } from './lib/supabase';
import { previewPet, useOhmieStore } from './lib/store';

const Organizer = lazy(() => import('./pages/Features').then((module) => ({ default: module.Organizer })));
const MoodTracker = lazy(() => import('./pages/Features').then((module) => ({ default: module.MoodTracker })));
const ChatPage = lazy(() => import('./pages/Features').then((module) => ({ default: module.ChatPage })));
const PlayZone = lazy(() => import('./pages/Features').then((module) => ({ default: module.PlayZone })));
const EmotionGallery = lazy(() => import('./pages/Features').then((module) => ({ default: module.EmotionGallery })));
const SharedPet = lazy(() => import('./pages/SharedPet').then((module) => ({ default: module.SharedPet })));
const Architecture = lazy(() => import('./pages/Features').then((module) => ({ default: module.Architecture })));
const SettingsPage = lazy(() => import('./pages/Features').then((module) => ({ default: module.SettingsPage })));

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [connection, setConnection] = useState<'online' | 'offline' | 'preview'>(isSupabaseConfigured ? 'offline' : 'preview');
  const petId = useOhmieStore((state) => state.pet.id);
  const setPet = useOhmieStore((state) => state.setPet);
  const cloudReady = Boolean(user && isSupabaseConfigured && connection === 'online');

  useEffect(() => {
    let mounted = true;
    let activeUserId: string | null = null;
    const applySessionUser = (nextUser: User | null) => {
      if (activeUserId !== nextUser?.id) {
        useOhmieStore.getState().setTasks([]);
        useOhmieStore.setState({ moods: [] });
        if (activeUserId !== null || nextUser !== null) useOhmieStore.getState().setPet(previewPet);
        activeUserId = nextUser?.id ?? null;
      }
      setUser(nextUser);
    };
    const checkApi = () => fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(2500) })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((health) => mounted && setConnection(isSupabaseConfigured && health.mode === 'connected' ? 'online' : 'preview'))
      .catch(() => mounted && setConnection(isSupabaseConfigured ? 'offline' : 'preview'));
    void checkApi();
    const interval = window.setInterval(checkApi, 30_000);
    const onOnline = () => void checkApi();
    const onOffline = () => mounted && setConnection(isSupabaseConfigured ? 'offline' : 'preview');
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => { if (mounted) applySessionUser(session?.user ?? null); });
    void supabase?.auth.getSession().then(({ data }) => mounted && applySessionUser(data.session?.user ?? null));
    const storedTheme = localStorage.getItem('ohmie-theme');
    if (storedTheme === 'dark') document.documentElement.classList.add('dark-mode');
    return () => { mounted = false; window.clearInterval(interval); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); subscription?.data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!cloudReady) return;
    let mounted = true;
    void apiRequest<{ pet: Pet | null }>('/api/pets/current').then(({ pet }) => { if (mounted && pet) setPet(pet); }).catch(() => undefined);
    return () => { mounted = false; };
  }, [cloudReady, user?.id, setPet]);

  useEffect(() => {
    if (!cloudReady || petId === previewPet.id) return;
    const channel = supabase!.channel(`shared-pet-${petId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pets', filter: `id=eq.${petId}` }, (payload) => setPet(payload.new as Pet))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pet_activities', filter: `pet_id=eq.${petId}` }, (payload) => {
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden && payload.new.user_id !== user?.id) {
          new Notification('Ohmie had a little moment', { body: 'Someone in your circle spent a moment with Ohmie.', tag: `pet-activity-${payload.new.id}` });
        }
      })
      .subscribe((status) => { if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnection('offline'); else if (status === 'SUBSCRIBED') setConnection('online'); });
    return () => { void supabase!.removeChannel(channel); };
  }, [cloudReady, petId, setPet, user?.id]);

  useEffect(() => {
    if (!cloudReady || !user || !supabase || !('Notification' in window) || Notification.permission !== 'granted') return;
    let tasks: { id: string; title: string; due_date: string }[] = [];
    void supabase.from('tasks').select('id,title,due_date').eq('completed', false).not('due_date', 'is', null).then(({ data }) => { tasks = (data ?? []) as typeof tasks; });
    const check = () => {
      const now = Date.now();
      for (const task of tasks) {
        const dueAt = new Date(task.due_date).getTime();
        const key = `ohmie-task-reminder-${user.id}-${task.id}`;
        if (dueAt <= now + 60_000 && dueAt > now - 5 * 60_000 && !sessionStorage.getItem(key)) {
          new Notification('A gentle nudge from Ohmie', { body: task.title, tag: key }); sessionStorage.setItem(key, 'shown');
        }
      }
      const nowDate = new Date();
      const todayKey = `ohmie-daily-checkin-${user.id}-${nowDate.toLocaleDateString()}`;
      if (nowDate.getHours() >= 19 && !sessionStorage.getItem(todayKey)) {
        new Notification('A little check-in?', { body: 'Take a moment to notice how you’re feeling today.', tag: todayKey }); sessionStorage.setItem(todayKey, 'shown');
      }
    };
    const timer = window.setInterval(check, 60_000); check();
    return () => window.clearInterval(timer);
  }, [cloudReady, user?.id]);

  const contextValue = useMemo(() => ({ user, setUser, cloudReady, connection }), [user, cloudReady, connection]);
  return <AppContext.Provider value={contextValue}><Suspense fallback={<div className="page-loading"><span className="brand-mark">ϟ</span><span>One little moment…</span></div>}><Routes>
    <Route element={<Layout/>}>
      <Route index element={<Dashboard/>}/>
      <Route path="organizer" element={<Organizer/>}/>
      <Route path="mood" element={<MoodTracker/>}/>
      <Route path="chat" element={<ChatPage/>}/>
      <Route path="play" element={<PlayZone/>}/>
      <Route path="emotions" element={<EmotionGallery/>}/>
      <Route path="shared" element={<SharedPet/>}/>
      <Route path="architecture" element={<Architecture/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Route>
  </Routes></Suspense></AppContext.Provider>;
}
