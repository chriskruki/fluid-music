'use client'

import { FluidSimulator } from '@/components/fluid-simulator/FluidSimulator'

export default function SimulatorPage() {
  return (
    <div className="h-screen w-screen relative bg-black">
      <FluidSimulator />
    </div>
  )
}

