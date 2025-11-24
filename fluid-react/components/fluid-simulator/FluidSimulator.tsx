'use client'

import { useRef } from 'react'
import { useFluidSimulation } from '@/hooks/useFluidSimulation'
import { useFluidConfig } from '@/stores/fluidConfig'
import { SimulationCanvas } from './SimulationCanvas'
import { SettingsDrawer } from './SettingsDrawer'

export function FluidSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const config = useFluidConfig((state) => state.config)
  
  const {
    isInitialized,
    error,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    createPattern,
    createRandomSplats
  } = useFluidSimulation(canvasRef, config)
  
  return (
    <div className="relative w-full h-full">
      {/* Always render canvas so ref is available for initialization */}
      <SimulationCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-red-900 bg-opacity-90 z-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error.message}</p>
            <pre className="mt-4 text-sm text-left bg-black bg-opacity-50 p-4 rounded overflow-auto max-w-2xl max-h-96">
              {error.stack}
            </pre>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {!isInitialized && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-80 z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Initializing simulation...</p>
          </div>
        </div>
      )}
      
      <SettingsDrawer />
    </div>
  )
}

