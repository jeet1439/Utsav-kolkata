import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const zustandStorage = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (updatedUser) => set({ user: updatedUser }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "user-storage",
      storage: zustandStorage, 
    }
  )
);
