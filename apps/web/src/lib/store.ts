import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Emotion, Pet, PetAction, Task, Mood } from './supabase';

export const previewPet: Pet = { id: 'preview-ohmie', name: 'Ohmie', happiness: 78, energy: 68, friendship: 46, experience: 60, level: 2, emotion: 'happy', sleep_status: false };
const previewTasks: Task[] = [
  { id: 'demo-1', title: 'Plan a gentle start to the day', description: 'Pick one thing that matters most.', priority: 'medium', completed: false, created_at: new Date().toISOString() },
  { id: 'demo-2', title: 'Take a little screen break', description: '', priority: 'low', completed: true, created_at: new Date().toISOString() },
];
const emotionByAction: Record<PetAction, Emotion> = { pet: 'happy', feed: 'excited', play: 'excited', talk: 'curious', sleep: 'sleeping', wake: 'happy', reward: 'excited', daily_reward: 'excited' };
const delta: Record<PetAction, Partial<Pet>> = {
  pet: { happiness: 6, friendship: 5 }, feed: { happiness: 12, energy: 8 }, play: { happiness: 5, energy: -12, friendship: 8, experience: 12 },
  talk: { happiness: 3, friendship: 4 }, sleep: {}, wake: { energy: 25 }, reward: { happiness: 8, experience: 20 }, daily_reward: { happiness: 8, experience: 20 },
};
const capped = (value: number) => Math.max(0, Math.min(100, value));

type Store = {
  pet: Pet;
  tasks: Task[];
  moods: Mood[];
  timeline: { id: string; label: string; time: string; action?: PetAction }[];
  interaction: PetAction | null;
  lastSynced: string | null;
  setPet: (pet: Pet) => void;
  setInteraction: (action: PetAction | null) => void;
  performPreviewAction: (action: PetAction, userName?: string) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, update: Partial<Task>) => void;
  removeTask: (id: string) => void;
  addMood: (mood: Mood) => void;
};

export const useOhmieStore = create<Store>()(persist((set, get) => ({
  pet: previewPet,
  tasks: previewTasks,
  moods: [],
  timeline: [
    { id: 'line-1', label: 'Ohmie stretched awake', time: 'Today, 8:10 AM' },
    { id: 'line-2', label: 'You and Ohmie shared a little moment', time: 'Yesterday' },
  ],
  interaction: null,
  lastSynced: null,
  setPet: (pet) => set({ pet, lastSynced: new Date().toISOString() }),
  setInteraction: (interaction) => set({ interaction }),
  performPreviewAction: (action, userName = 'You') => {
    const current = get().pet;
    const changes = delta[action];
    const next: Pet = {
      ...current,
      happiness: capped(current.happiness + (changes.happiness ?? 0)),
      energy: capped(current.energy + (changes.energy ?? 0)),
      friendship: capped(current.friendship + (changes.friendship ?? 0)),
      experience: current.experience + (changes.experience ?? 0),
      level: Math.max(current.level, 1 + Math.floor((current.experience + (changes.experience ?? 0)) / 100)),
      emotion: emotionByAction[action],
      sleep_status: action === 'sleep' ? true : action === 'wake' ? false : current.sleep_status,
    };
    const label: Record<PetAction, string> = { pet: `${userName} gave Ohmie a gentle pet`, feed: `${userName} brought Ohmie a little snack`, play: `${userName} played with Ohmie`, talk: `${userName} had a chat with Ohmie`, sleep: 'Ohmie curled up for a nap', wake: 'Ohmie woke up refreshed', reward: 'Ohmie celebrated a little win', daily_reward: 'The circle collected a daily spark' };
    set((state) => ({ pet: next, interaction: action, timeline: [{ id: crypto.randomUUID(), label: label[action], time: 'Just now', action }, ...state.timeline].slice(0, 8) }));
    window.setTimeout(() => set({ interaction: null }), 1500);
  },
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, update) => set((state) => ({ tasks: state.tasks.map((task) => task.id === id ? { ...task, ...update } : task) })),
  removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
  addMood: (mood) => set((state) => ({ moods: [mood, ...state.moods] })),
}), { name: 'ohmie-preview-v1', partialize: (state) => ({ pet: state.pet, timeline: state.timeline }) }));
