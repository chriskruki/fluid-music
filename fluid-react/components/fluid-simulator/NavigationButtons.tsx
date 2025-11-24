'use client'

import Link from 'next/link'
import { Home, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NavigationButtons() {
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
  
  return (
    <div className={`fixed top-20 right-4 z-50 flex flex-col gap-2 ${
      isMobile ? 'opacity-50' : 'opacity-50 hover:opacity-100'
    } transition-opacity`}>
      <Link href="/">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="Go to home"
        >
          <Home className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="/control">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="Go to controller"
        >
          <Gamepad2 className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  )
}

