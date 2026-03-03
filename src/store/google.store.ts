import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GoogleUser {
    email: string;
    name: string;
    picture: string;
    accessToken: string;
}

interface GoogleState {
    user: GoogleUser | null;
    isSyncing: boolean;
    lastSyncAt: string | null;
    syncLog: string[];
    setUser: (user: GoogleUser | null) => void;
    setSyncing: (v: boolean) => void;
    setLastSync: (t: string) => void;
    addLog: (msg: string) => void;
    clearLog: () => void;
}

export const useGoogleStore = create<GoogleState>()(
    persist(
        (set) => ({
            user: null,
            isSyncing: false,
            lastSyncAt: null,
            syncLog: [],

            setUser: (user) => set({ user }),
            setSyncing: (v) => set({ isSyncing: v }),
            setLastSync: (t) => set({ lastSyncAt: t }),
            addLog: (msg) => set((s) => ({ syncLog: [...s.syncLog.slice(-49), msg] })),
            clearLog: () => set({ syncLog: [] }),
        }),
        { name: 'smartshop-google', partialize: (s) => ({ user: s.user, lastSyncAt: s.lastSyncAt }) }
    )
);
