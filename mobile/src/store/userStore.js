import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (updatedUser) => set({ user: updatedUser }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "user-storage", 
      getStorage: () => AsyncStorage, 
    }
  )
);
