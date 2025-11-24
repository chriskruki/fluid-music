import { presets, applyPreset, getPreset } from '@/lib/fluid/presets'
import type { FluidConfig } from '@/types/fluid'

describe('Presets', () => {
  describe('presets object', () => {
    it('should have default preset', () => {
      expect(presets.default).toBeDefined()
      expect(presets.default.name).toBe('Default')
      expect(presets.default.description).toBeTruthy()
    })

    it('should have all expected presets', () => {
      expect(presets.default).toBeDefined()
      expect(presets.high_quality).toBeDefined()
      expect(presets.performance).toBeDefined()
      expect(presets.single_color).toBeDefined()
      expect(presets.mandala).toBeDefined()
    })

    it('should have valid config for each preset', () => {
      Object.values(presets).forEach((preset) => {
        expect(preset.config).toBeDefined()
        expect(typeof preset.config).toBe('object')
      })
    })
  })

  describe('default preset', () => {
    it('should match specified requirements', () => {
      const defaultPreset = presets.default.config
      
      expect(defaultPreset.SUNRAYS).toBe(false)
      expect(defaultPreset.BLOOM).toBe(false)
      expect(defaultPreset.SPLAT_RADIUS).toBe(0.05)
      expect(defaultPreset.DENSITY_DISSIPATION).toBe(2.0)
      expect(defaultPreset.RAINBOW_MODE).toBe(true)
      expect(defaultPreset.BACK_COLOR).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('getPreset', () => {
    it('should return preset for valid name', () => {
      const preset = getPreset('default')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('Default')
    })

    it('should return undefined for invalid name', () => {
      const preset = getPreset('invalid')
      expect(preset).toBeUndefined()
    })
  })

  describe('applyPreset', () => {
    it('should return config object for valid preset', () => {
      const config = applyPreset('default')
      
      expect(config).not.toBeNull()
      expect(config).toHaveProperty('SUNRAYS')
      expect(config).toHaveProperty('BLOOM')
      expect(config).toHaveProperty('SPLAT_RADIUS')
    })

    it('should return null for invalid preset', () => {
      const config = applyPreset('nonexistent')
      expect(config).toBeNull()
    })

    it('should return partial config (not full FluidConfig)', () => {
      const config = applyPreset('default')
      
      // Should have some properties but not necessarily all
      expect(config).toHaveProperty('SUNRAYS')
      // May not have all properties
    })
  })

  describe('preset configurations', () => {
    it('high_quality preset should enable effects', () => {
      const config = presets.high_quality.config
      expect(config.SUNRAYS).toBe(true)
      expect(config.BLOOM).toBe(true)
    })

    it('performance preset should disable effects', () => {
      const config = presets.performance.config
      expect(config.SUNRAYS).toBe(false)
      expect(config.BLOOM).toBe(false)
      expect(config.SHADING).toBe(false)
    })

    it('single_color preset should disable rainbow mode', () => {
      const config = presets.single_color.config
      expect(config.RAINBOW_MODE).toBe(false)
    })

    it('mandala preset should enable mirror mode', () => {
      const config = presets.mandala.config
      expect(config.MIRROR_MODE).toBe(true)
      expect(config.MIRROR_SEGMENTS).toBe(8)
    })
  })
})

