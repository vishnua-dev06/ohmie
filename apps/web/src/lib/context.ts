import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export type AppContextValue = { user: User | null; setUser: (user: User | null) => void; cloudReady: boolean; connection: 'online' | 'offline' | 'preview' };
export const AppContext = createContext<AppContextValue>({ user: null, setUser: () => undefined, cloudReady: false, connection: 'preview' });
export const useApp = () => useContext(AppContext);
