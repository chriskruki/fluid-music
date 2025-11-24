'use client'

import { RemoteController } from '@/components/remote-controller/RemoteController'

export default function ControllerPage() {
  return (
    <div className="h-screen w-screen relative bg-black">
      <RemoteController />
    </div>
  )
}

