/**
 * Configuration presets for fluid simulation
 */

import type { FluidConfig } from '@/types/fluid'

export interface Preset {
  name: string
  description: string
  config: Partial<FluidConfig>
}

export const presets: Record<string, Preset> = {
  default: {
    name: 'Default',
    description: 'Balanced settings with rainbow mode',
    config: {
      SUNRAYS: false,
      BLOOM: false,
      SPLAT_RADIUS: 0.05,
      DENSITY_DISSIPATION: 2.0,
      RAINBOW_MODE: true,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      SHADING: true,
      COLORFUL: true,
      COLOR_UPDATE_SPEED: 10,
      MIRROR_MODE: false,
      MIRROR_SEGMENTS: 2,
      SPLAT_FORCE: 6000,
      SPLAT_SPEED: 1000,
      SPLAT_COUNT: 5,
      VELOCITY_DISSIPATION: 0.1,
      PRESSURE: 0.2,
      PRESSURE_ITERATIONS: 20,
      CURL: 5,
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      TRANSPARENT: false
    }
  },
  high_quality: {
    name: 'High Quality',
    description: 'Maximum visual quality with all effects',
    config: {
      SUNRAYS: true,
      BLOOM: true,
      SPLAT_RADIUS: 0.25,
      DENSITY_DISSIPATION: 0.5,
      RAINBOW_MODE: true,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      SHADING: true,
      COLORFUL: true,
      COLOR_UPDATE_SPEED: 10,
      DYE_RESOLUTION: 1024,
      BLOOM_ITERATIONS: 8,
      BLOOM_INTENSITY: 0.1,
      SUNRAYS_WEIGHT: 0.5
    }
  },
  performance: {
    name: 'Performance',
    description: 'Optimized for lower-end devices',
    config: {
      SUNRAYS: false,
      BLOOM: false,
      SHADING: false,
      SPLAT_RADIUS: 0.1,
      DENSITY_DISSIPATION: 1.5,
      RAINBOW_MODE: true,
      DYE_RESOLUTION: 512,
      SIM_RESOLUTION: 64
    }
  },
  single_color: {
    name: 'Single Color',
    description: 'Fixed color mode',
    config: {
      RAINBOW_MODE: false,
      SPLAT_COLOR: { r: 0.15, g: 0.5, b: 1.0 },
      SUNRAYS: false,
      BLOOM: false,
      DENSITY_DISSIPATION: 2.0,
      SPLAT_RADIUS: 0.05
    }
  },
  mandala: {
    name: 'Mandala',
    description: 'Mirror mode with 8 segments',
    config: {
      MIRROR_MODE: true,
      MIRROR_SEGMENTS: 8,
      RAINBOW_MODE: true,
      SUNRAYS: true,
      BLOOM: true,
      DENSITY_DISSIPATION: 1.0,
      SPLAT_RADIUS: 0.15
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

