import { defaultConfig, mergeConfig } from '@/lib/fluid/config'
import { applyPreset, presets } from '@/lib/fluid/presets'
import type { FluidConfig } from '@/types/fluid'

describe('Fluid Config', () => {
  describe('defaultConfig', () => {
    it('should have all required properties', () => {
      expect(defaultConfig).toHaveProperty('SIM_RESOLUTION')
      expect(defaultConfig).toHaveProperty('DYE_RESOLUTION')
      expect(defaultConfig).toHaveProperty('DENSITY_DISSIPATION')
      expect(defaultConfig).toHaveProperty('SPLAT_RADIUS')
      expect(defaultConfig).toHaveProperty('RAINBOW_MODE')
      expect(defaultConfig).toHaveProperty('BACK_COLOR')
    })

    it('should match default preset values', () => {
      expect(defaultConfig.SUNRAYS).toBe(false)
      expect(defaultConfig.BLOOM).toBe(false)
      expect(defaultConfig.SPLAT_RADIUS).toBe(0.05)
      expect(defaultConfig.DENSITY_DISSIPATION).toBe(2.0)
      expect(defaultConfig.RAINBOW_MODE).toBe(true)
      expect(defaultConfig.BACK_COLOR).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('mergeConfig', () => {
    it('should merge partial config with defaults', () => {
      const partial: Partial<FluidConfig> = {
        SPLAT_RADIUS: 0.1,
        RAINBOW_MODE: false,
      }
      
      const merged = mergeConfig(partial)
      
      expect(merged.SPLAT_RADIUS).toBe(0.1)
      expect(merged.RAINBOW_MODE).toBe(false)
      expect(merged.SIM_RESOLUTION).toBe(defaultConfig.SIM_RESOLUTION)
    })

    it('should return default config when no partial provided', () => {
      const merged = mergeConfig()
      
      expect(merged).toEqual(defaultConfig)
    })
  })
})

describe('Presets', () => {
  describe('presets object', () => {
    it('should have default preset', () => {
      expect(presets.default).toBeDefined()
      expect(presets.default.name).toBe('Default')
    })

    it('should have all preset definitions', () => {
      expect(presets.high_quality).toBeDefined()
      expect(presets.performance).toBeDefined()
      expect(presets.single_color).toBeDefined()
      expect(presets.mandala).toBeDefined()
    })
  })

  describe('applyPreset', () => {
    it('should return config for valid preset', () => {
      const config = applyPreset('default')
      
      expect(config).not.toBeNull()
      expect(config).toHaveProperty('SUNRAYS')
      expect(config).toHaveProperty('BLOOM')
    })

    it('should return null for invalid preset', () => {
      const config = applyPreset('invalid_preset')
      
      expect(config).toBeNull()
    })

    it('should apply default preset correctly', () => {
      const config = applyPreset('default')
      
      expect(config?.SUNRAYS).toBe(false)
      expect(config?.BLOOM).toBe(false)
      expect(config?.SPLAT_RADIUS).toBe(0.05)
      expect(config?.DENSITY_DISSIPATION).toBe(2.0)
      expect(config?.RAINBOW_MODE).toBe(true)
    })
  })
})

