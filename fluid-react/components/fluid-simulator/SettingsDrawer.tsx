'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useFluidConfig } from '@/stores/fluidConfig'
import { presets, applyPreset } from '@/lib/fluid/presets'
import type { FluidConfig } from '@/types/fluid'

export function SettingsDrawer() {
  const [open, setOpen] = useState(false)
  const config = useFluidConfig((state) => state.config)
  const updateConfig = useFluidConfig((state) => state.updateConfig)
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
  
  const handlePresetChange = (presetName: string) => {
    const presetConfig = applyPreset(presetName)
    if (presetConfig) {
      updateConfig(presetConfig)
    }
  }
  
  const handleColorChange = (color: 'splat' | 'background', value: string) => {
    const hex = value.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    if (color === 'splat') {
      updateConfig({ SPLAT_COLOR: { r, g, b } })
    } else {
      updateConfig({ BACK_COLOR: { r: r * 255, g: g * 255, b: b * 255 } })
    }
  }
  
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }
  
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
        
        <Tabs defaultValue="basic" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Presets */}
            <div className="space-y-2">
              <Label>Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(presets).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetChange(key)}
                    className="h-auto py-2 flex flex-col"
                  >
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
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
                onValueChange={([value]) => updateConfig({ SPLAT_RADIUS: value })}
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
                  disabled={config.RAINBOW_MODE}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.RAINBOW_MODE}
                      onCheckedChange={(checked) => updateConfig({ RAINBOW_MODE: checked })}
                    />
                    <Label>Rainbow Mode</Label>
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
                  onCheckedChange={(checked) => updateConfig({ MIRROR_MODE: checked })}
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
                    onValueChange={([value]) => updateConfig({ MIRROR_SEGMENTS: Math.round(value) })}
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
                onValueChange={([value]) => updateConfig({ DENSITY_DISSIPATION: value })}
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
                onValueChange={([value]) => updateConfig({ SIM_RESOLUTION: Math.round(value) })}
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
                onValueChange={([value]) => updateConfig({ DYE_RESOLUTION: Math.round(value) })}
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
                onValueChange={([value]) => updateConfig({ VELOCITY_DISSIPATION: value })}
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
                onValueChange={([value]) => updateConfig({ PRESSURE: value })}
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
                onValueChange={([value]) => updateConfig({ PRESSURE_ITERATIONS: Math.round(value) })}
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
                onValueChange={([value]) => updateConfig({ CURL: value })}
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
                onValueChange={([value]) => updateConfig({ SPLAT_FORCE: Math.round(value) })}
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
                onCheckedChange={(checked) => updateConfig({ SHADING: checked })}
              />
            </div>
            
            {/* Colorful */}
            <div className="flex items-center justify-between">
              <Label>Colorful</Label>
              <Switch
                checked={config.COLORFUL}
                onCheckedChange={(checked) => updateConfig({ COLORFUL: checked })}
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
                onValueChange={([value]) => updateConfig({ COLOR_UPDATE_SPEED: Math.round(value) })}
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
                onCheckedChange={(checked) => updateConfig({ BLOOM: checked })}
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
                    onValueChange={([value]) => updateConfig({ BLOOM_ITERATIONS: Math.round(value) })}
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
                    onValueChange={([value]) => updateConfig({ BLOOM_INTENSITY: value })}
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
                    onValueChange={([value]) => updateConfig({ BLOOM_THRESHOLD: value })}
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
                onCheckedChange={(checked) => updateConfig({ SUNRAYS: checked })}
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
                    onValueChange={([value]) => updateConfig({ SUNRAYS_WEIGHT: value })}
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
                onValueChange={([value]) => updateConfig({ SPLAT_SPEED: Math.round(value) })}
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
                onValueChange={([value]) => updateConfig({ SPLAT_COUNT: Math.round(value) })}
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

