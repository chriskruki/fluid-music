'use client'

import { useState, useEffect } from 'react'
import { Settings, Home, Monitor, Check } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useWebSocket } from '@/stores/websocket'
import { presets, applyPreset } from '@/lib/fluid/presets'
import type { FluidConfig } from '@/types/fluid'

export function ControllerSettingsDrawer() {
  const [open, setOpen] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false)
  const [promptError, setPromptError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { sendMessage } = useWebSocket()
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
  
  // Local state to track current config (for UI display)
  const [localConfig, setLocalConfig] = useState<Partial<FluidConfig>>({})
  
  // Mark component as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Fetch current prompt on load (client-side only)
  useEffect(() => {
    if (!mounted) return
    
    const fetchPrompt = async () => {
      try {
        const response = await fetch('/api/prompt')
        if (!response.ok) {
          throw new Error('Failed to fetch prompt')
        }
        const data = await response.json()
        if (data.text) {
          setPromptValue(data.text)
        }
        setPromptError(null)
      } catch (error) {
        setPromptError('TouchDesigner API unavailable. Please check TD_ENDPOINT configuration.')
      }
    }
    
    fetchPrompt()
  }, [mounted])
  
  const handleSubmitPrompt = async () => {
    if (!promptValue.trim()) return
    
    setIsSubmittingPrompt(true)
    setPromptError(null)
    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: promptValue }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit prompt')
      }
      
      // Clear the input on success
      setPromptValue('')
      setPromptError(null)
    } catch (error) {
      setPromptError('TouchDesigner API unavailable. Please check TD_ENDPOINT configuration.')
    } finally {
      setIsSubmittingPrompt(false)
    }
  }
  
  const sendConfigUpdate = (updates: Partial<FluidConfig>) => {
    const newConfig = { ...localConfig, ...updates }
    setLocalConfig(newConfig)
    
    sendMessage({
      type: 'command',
      payload: {
        command: 'update_simulator_config',
        parameters: { config: updates }
      }
    })
  }
  
  const handlePresetChange = (presetName: string) => {
    const presetConfig = applyPreset(presetName)
    if (presetConfig) {
      setLocalConfig({ ...localConfig, ...presetConfig })
      sendConfigUpdate(presetConfig)
    }
  }
  
  const handleColorChange = (color: 'splat' | 'background', value: string) => {
    const hex = value.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    if (color === 'splat') {
      sendConfigUpdate({ SPLAT_COLOR: { r, g, b } })
    } else {
      sendConfigUpdate({ BACK_COLOR: { r: r * 255, g: g * 255, b: b * 255 } })
    }
  }
  
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }
  
  // Get current config values (use local state or defaults)
  const getConfigValue = <K extends keyof FluidConfig>(key: K, defaultValue: FluidConfig[K]): FluidConfig[K] => {
    return (localConfig[key] as FluidConfig[K]) ?? defaultValue
  }
  
  // Default values for display
  const config = {
    SPLAT_RADIUS: getConfigValue('SPLAT_RADIUS', 0.13),
    SPLAT_COLOR: getConfigValue('SPLAT_COLOR', { r: 1, g: 0.1411764705882353, b: 0.1411764705882353 }),
    COLORFUL: getConfigValue('COLORFUL', false),
    MIRROR_MODE: getConfigValue('MIRROR_MODE', false),
    MIRROR_SEGMENTS: getConfigValue('MIRROR_SEGMENTS', 8),
    DENSITY_DISSIPATION: getConfigValue('DENSITY_DISSIPATION', 0.5),
    BACK_COLOR: getConfigValue('BACK_COLOR', { r: 0, g: 0, b: 0 }),
    SIM_RESOLUTION: getConfigValue('SIM_RESOLUTION', 128),
    DYE_RESOLUTION: getConfigValue('DYE_RESOLUTION', 1024),
    VELOCITY_DISSIPATION: getConfigValue('VELOCITY_DISSIPATION', 0.2),
    PRESSURE: getConfigValue('PRESSURE', 0.8),
    PRESSURE_ITERATIONS: getConfigValue('PRESSURE_ITERATIONS', 20),
    CURL: getConfigValue('CURL', 30),
    SPLAT_FORCE: getConfigValue('SPLAT_FORCE', 6000),
    SHADING: getConfigValue('SHADING', true),
    COLOR_UPDATE_SPEED: getConfigValue('COLOR_UPDATE_SPEED', 10),
    BLOOM: getConfigValue('BLOOM', false),
    BLOOM_ITERATIONS: getConfigValue('BLOOM_ITERATIONS', 8),
    BLOOM_INTENSITY: getConfigValue('BLOOM_INTENSITY', 0.8),
    BLOOM_THRESHOLD: getConfigValue('BLOOM_THRESHOLD', 0.6),
    SUNRAYS: getConfigValue('SUNRAYS', false),
    SUNRAYS_WEIGHT: getConfigValue('SUNRAYS_WEIGHT', 1.0),
    SPLAT_SPEED: getConfigValue('SPLAT_SPEED', 1000),
    SPLAT_COUNT: getConfigValue('SPLAT_COUNT', 3),
  } as FluidConfig
  
  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`fixed top-4 right-4 z-50 ${
            isMobile ? 'opacity-50' : 'opacity-50 hover:opacity-100'
          } transition-opacity`}
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px] overflow-y-auto pointer-events-auto"
        showOverlay={false}
      >
        <SheetHeader>
          <SheetTitle>Simulation Settings</SheetTitle>
        </SheetHeader>
        
        {/* Navigation Buttons */}
        <div className="flex gap-2 mt-4 mb-6">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          <Link href="/sim">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              <span>Simulator</span>
            </Button>
          </Link>
        </div>
        
        {/* Prompt Input */}
        <div className="mt-4 mb-6 space-y-2">
          <Label>Prompt</Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input
                value={promptValue}
                onChange={(e) => {
                  setPromptValue(e.target.value)
                  setPromptError(null)
                }}
                placeholder="Enter prompt text..."
                className={promptError ? 'border-destructive' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitPrompt()
                  }
                }}
              />
              {promptError && (
                <p className="text-sm text-destructive">{promptError}</p>
              )}
            </div>
            <Button
              onClick={handleSubmitPrompt}
              disabled={!promptValue.trim() || isSubmittingPrompt}
              size="icon"
              variant="outline"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="basic" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Presets */}
            <div className="space-y-2">
              <Label>Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(presets).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetChange(key)}
                    className="h-auto py-2"
                  >
                    <span className="font-semibold">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Splat Radius */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Splat Radius</Label>
                <span className="text-sm text-muted-foreground">{config.SPLAT_RADIUS.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.SPLAT_RADIUS]}
                onValueChange={([value]) => sendConfigUpdate({ SPLAT_RADIUS: value })}
                min={0.01}
                max={1.0}
                step={0.01}
              />
            </div>
            
            {/* Splat Color */}
            <div className="space-y-2">
              <Label>Splat Color</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={rgbToHex(config.SPLAT_COLOR.r, config.SPLAT_COLOR.g, config.SPLAT_COLOR.b)}
                  onChange={(e) => handleColorChange('splat', e.target.value)}
                  className="h-10 w-20 rounded border border-border bg-background"
                  disabled={config.COLORFUL}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.COLORFUL}
                      onCheckedChange={(checked) => sendConfigUpdate({ COLORFUL: checked })}
                    />
                    <Label>Colorful</Label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mirror Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mirror Mode</Label>
                <Switch
                  checked={config.MIRROR_MODE}
                  onCheckedChange={(checked) => sendConfigUpdate({ MIRROR_MODE: checked })}
                />
              </div>
              {config.MIRROR_MODE && (
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Mirror Segments</Label>
                    <span className="text-sm text-muted-foreground">{config.MIRROR_SEGMENTS}</span>
                  </div>
                  <Slider
                    value={[config.MIRROR_SEGMENTS]}
                    onValueChange={([value]) => sendConfigUpdate({ MIRROR_SEGMENTS: Math.round(value) })}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>
              )}
            </div>
            
            {/* Density Diffusion */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Density Diffusion</Label>
                <span className="text-sm text-muted-foreground">{config.DENSITY_DISSIPATION.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.DENSITY_DISSIPATION]}
                onValueChange={([value]) => sendConfigUpdate({ DENSITY_DISSIPATION: value })}
                min={0}
                max={4}
                step={0.1}
              />
            </div>
            
            {/* Background Color */}
            <div className="space-y-2">
              <Label>Background Color</Label>
              <input
                type="color"
                value={rgbToHex(config.BACK_COLOR.r / 255, config.BACK_COLOR.g / 255, config.BACK_COLOR.b / 255)}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="h-10 w-full rounded border border-border bg-background"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6 mt-6">
            {/* Simulation Resolution */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Simulation Resolution</Label>
                <span className="text-sm text-muted-foreground">{config.SIM_RESOLUTION}</span>
              </div>
              <Slider
                value={[config.SIM_RESOLUTION]}
                onValueChange={([value]) => sendConfigUpdate({ SIM_RESOLUTION: Math.round(value) })}
                min={32}
                max={256}
                step={32}
              />
            </div>
            
            {/* Dye Resolution */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Dye Resolution</Label>
                <span className="text-sm text-muted-foreground">{config.DYE_RESOLUTION}</span>
              </div>
              <Slider
                value={[config.DYE_RESOLUTION]}
                onValueChange={([value]) => sendConfigUpdate({ DYE_RESOLUTION: Math.round(value) })}
                min={128}
                max={2048}
                step={128}
              />
            </div>
            
            {/* Velocity Dissipation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Velocity Dissipation</Label>
                <span className="text-sm text-muted-foreground">{config.VELOCITY_DISSIPATION.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.VELOCITY_DISSIPATION]}
                onValueChange={([value]) => sendConfigUpdate({ VELOCITY_DISSIPATION: value })}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            
            {/* Pressure */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pressure</Label>
                <span className="text-sm text-muted-foreground">{config.PRESSURE.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.PRESSURE]}
                onValueChange={([value]) => sendConfigUpdate({ PRESSURE: value })}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            
            {/* Pressure Iterations */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pressure Iterations</Label>
                <span className="text-sm text-muted-foreground">{config.PRESSURE_ITERATIONS}</span>
              </div>
              <Slider
                value={[config.PRESSURE_ITERATIONS]}
                onValueChange={([value]) => sendConfigUpdate({ PRESSURE_ITERATIONS: Math.round(value) })}
                min={1}
                max={50}
                step={1}
              />
            </div>
            
            {/* Curl */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Curl</Label>
                <span className="text-sm text-muted-foreground">{config.CURL.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.CURL]}
                onValueChange={([value]) => sendConfigUpdate({ CURL: value })}
                min={0}
                max={20}
                step={0.5}
              />
            </div>
            
            {/* Splat Force */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Splat Force</Label>
                <span className="text-sm text-muted-foreground">{config.SPLAT_FORCE}</span>
              </div>
              <Slider
                value={[config.SPLAT_FORCE]}
                onValueChange={([value]) => sendConfigUpdate({ SPLAT_FORCE: Math.round(value) })}
                min={1000}
                max={20000}
                step={500}
              />
            </div>
            
            {/* Shading */}
            <div className="flex items-center justify-between">
              <Label>Shading</Label>
              <Switch
                checked={config.SHADING}
                onCheckedChange={(checked) => sendConfigUpdate({ SHADING: checked })}
              />
            </div>
            
            {/* Color Update Speed */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Color Update Speed</Label>
                <span className="text-sm text-muted-foreground">{config.COLOR_UPDATE_SPEED}</span>
              </div>
              <Slider
                value={[config.COLOR_UPDATE_SPEED]}
                onValueChange={([value]) => sendConfigUpdate({ COLOR_UPDATE_SPEED: Math.round(value) })}
                min={0}
                max={50}
                step={1}
              />
            </div>
            
            {/* Bloom */}
            <div className="flex items-center justify-between">
              <Label>Bloom</Label>
              <Switch
                checked={config.BLOOM}
                onCheckedChange={(checked) => sendConfigUpdate({ BLOOM: checked })}
              />
            </div>
            
            {config.BLOOM && (
              <div className="pl-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Bloom Iterations</Label>
                    <span className="text-sm text-muted-foreground">{config.BLOOM_ITERATIONS}</span>
                  </div>
                  <Slider
                    value={[config.BLOOM_ITERATIONS]}
                    onValueChange={([value]) => sendConfigUpdate({ BLOOM_ITERATIONS: Math.round(value) })}
                    min={1}
                    max={16}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Bloom Intensity</Label>
                    <span className="text-sm text-muted-foreground">{config.BLOOM_INTENSITY.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[config.BLOOM_INTENSITY]}
                    onValueChange={([value]) => sendConfigUpdate({ BLOOM_INTENSITY: value })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Bloom Threshold</Label>
                    <span className="text-sm text-muted-foreground">{config.BLOOM_THRESHOLD.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[config.BLOOM_THRESHOLD]}
                    onValueChange={([value]) => sendConfigUpdate({ BLOOM_THRESHOLD: value })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            )}
            
            {/* Sunrays */}
            <div className="flex items-center justify-between">
              <Label>Sunrays</Label>
              <Switch
                checked={config.SUNRAYS}
                onCheckedChange={(checked) => sendConfigUpdate({ SUNRAYS: checked })}
              />
            </div>
            
            {config.SUNRAYS && (
              <div className="pl-4 space-y-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Sunrays Weight</Label>
                    <span className="text-sm text-muted-foreground">{config.SUNRAYS_WEIGHT.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[config.SUNRAYS_WEIGHT]}
                    onValueChange={([value]) => sendConfigUpdate({ SUNRAYS_WEIGHT: value })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>
            )}
            
            {/* Splat Speed */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Splat Speed</Label>
                <span className="text-sm text-muted-foreground">{config.SPLAT_SPEED}</span>
              </div>
              <Slider
                value={[config.SPLAT_SPEED]}
                onValueChange={([value]) => sendConfigUpdate({ SPLAT_SPEED: Math.round(value) })}
                min={100}
                max={5000}
                step={100}
              />
            </div>
            
            {/* Splat Count */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Splat Count</Label>
                <span className="text-sm text-muted-foreground">{config.SPLAT_COUNT}</span>
              </div>
              <Slider
                value={[config.SPLAT_COUNT]}
                onValueChange={([value]) => sendConfigUpdate({ SPLAT_COUNT: Math.round(value) })}
                min={1}
                max={20}
                step={1}
              />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

