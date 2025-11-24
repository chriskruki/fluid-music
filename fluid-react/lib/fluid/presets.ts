/**
 * Configuration presets for fluid simulation
 */

import type { FluidConfig } from '@/types/fluid'

export interface Preset {
  name: string
  config: Partial<FluidConfig>
}

export const presets: Record<string, Preset> = {
  draw: {
    name: 'Draw',
    config: {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      CAPTURE_RESOLUTION: 512,
      DENSITY_DISSIPATION: 0.5,
      VELOCITY_DISSIPATION: 0.3,
      PRESSURE: 0.04,
      PRESSURE_ITERATIONS: 20,
      CURL: 0,
      SPLAT_RADIUS: 0.13,
      SPLAT_FORCE: 1000,
      SHADING: true,
      COLORFUL: false,
      COLOR_UPDATE_SPEED: 10,
      PAUSED: false,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: false,
      BLOOM: false,
      BLOOM_ITERATIONS: 8,
      BLOOM_RESOLUTION: 256,
      BLOOM_INTENSITY: 0.1,
      BLOOM_THRESHOLD: 0.6,
      BLOOM_SOFT_KNEE: 0.7,
      SUNRAYS: false,
      SUNRAYS_RESOLUTION: 196,
      SUNRAYS_WEIGHT: 0.5,
      MIRROR_MODE: false,
      MIRROR_SEGMENTS: 2,
      SPLAT_SPEED: 5000,
      SPLAT_COUNT: 1,
      SHOW_DEBUG: false,
      RAINBOW_MODE: false,
      SPLAT_COLOR: { r: 1, g: 0.1411764705882353, b: 0.1411764705882353 }
    }
  },
  swirl: {
    name: 'Swirl',
    config: {
      RAINBOW_MODE: true,
      COLORFUL: true,
      CURL: 30,
      SPLAT_RADIUS: 0.25,
      DENSITY_DISSIPATION: 1.0,
      VELOCITY_DISSIPATION: 0.2,
      SHADING: true,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      SUNRAYS: false,
      BLOOM: false,
      MIRROR_MODE: false,
      MIRROR_SEGMENTS: 2,
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      COLOR_UPDATE_SPEED: 10,
      SPLAT_FORCE: 6000,
      SPLAT_SPEED: 1000,
      SPLAT_COUNT: 5
    }
  },
  mandala: {
    name: 'Mandala',
    config: {
      MIRROR_MODE: true,
      MIRROR_SEGMENTS: 8,
      RAINBOW_MODE: true,
      COLORFUL: true,
      SUNRAYS: true,
      BLOOM: true,
      DENSITY_DISSIPATION: 1.0,
      SPLAT_RADIUS: 0.15,
      SHADING: true,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      COLOR_UPDATE_SPEED: 10,
      CURL: 5,
      VELOCITY_DISSIPATION: 0.1,
      PRESSURE: 0.2,
      PRESSURE_ITERATIONS: 20
    }
  }
}

export function getPreset(name: string): Preset | undefined {
  return presets[name]
}

export function applyPreset(presetName: string): Partial<FluidConfig> | null {
  const preset = presets[presetName]
  return preset ? preset.config : null
}

