import { renderHook, act } from '@testing-library/react'
import { useFluidConfig } from '@/stores/fluidConfig'
import { defaultConfig } from '@/lib/fluid/config'

describe('FluidConfig Store', () => {
  it('should initialize with default config', () => {
    const { result } = renderHook(() => useFluidConfig())
    
    expect(result.current.config).toEqual(defaultConfig)
  })

  it('should update config', () => {
    const { result } = renderHook(() => useFluidConfig())
    
    act(() => {
      result.current.updateConfig({
        SPLAT_RADIUS: 0.1,
        RAINBOW_MODE: false,
      })
    })
    
    expect(result.current.config.SPLAT_RADIUS).toBe(0.1)
    expect(result.current.config.RAINBOW_MODE).toBe(false)
    expect(result.current.config.SIM_RESOLUTION).toBe(defaultConfig.SIM_RESOLUTION)
  })

  it('should reset config to defaults', () => {
    const { result } = renderHook(() => useFluidConfig())
    
    // Update config
    act(() => {
      result.current.updateConfig({
        SPLAT_RADIUS: 0.5,
        RAINBOW_MODE: false,
      })
    })
    
    // Reset
    act(() => {
      result.current.resetConfig()
    })
    
    expect(result.current.config).toEqual(defaultConfig)
  })

  it('should merge partial updates', () => {
    const { result } = renderHook(() => useFluidConfig())
    
    const initialSplatRadius = result.current.config.SPLAT_RADIUS
    
    act(() => {
      result.current.updateConfig({
        DENSITY_DISSIPATION: 3.0,
      })
    })
    
    expect(result.current.config.DENSITY_DISSIPATION).toBe(3.0)
    expect(result.current.config.SPLAT_RADIUS).toBe(initialSplatRadius)
  })
})

