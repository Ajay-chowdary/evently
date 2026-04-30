"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRoleMode = "attending" | "organizing";

type UserRoleState = {
  mode: UserRoleMode;
  setMode: (mode: UserRoleMode) => void;
  toggle: () => void;
};

export const useUserRoleStore = create<UserRoleState>()(
  persist(
    (set, get) => ({
      mode: "attending",
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === "attending" ? "organizing" : "attending" }),
    }),
    {
      name: "evently-user-role-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
