/**
 * Zustand store for fluid simulation configuration
 */

import { create } from 'zustand'
import type { FluidConfig } from '@/types/fluid'
import { defaultConfig } from '@/lib/fluid/config'

interface FluidConfigState {
  config: FluidConfig
  updateConfig: (updates: Partial<FluidConfig>) => void
  resetConfig: () => void
}

export const useFluidConfig = create<FluidConfigState>((set) => ({
  config: { ...defaultConfig },
  updateConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates }
  })),
  resetConfig: () => set({ config: { ...defaultConfig } })
}))

