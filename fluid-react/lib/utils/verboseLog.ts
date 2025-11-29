/**
 * Verbose logging utility
 * Only logs when FLUID_VERBOSE environment variable is set
 */

const isVerbose = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.FLUID_VERBOSE === 'true' || process.env.FLUID_VERBOSE === '1'
  }
  if (typeof window !== 'undefined') {
    // Check localStorage for client-side verbose mode
    return localStorage.getItem('FLUID_VERBOSE') === 'true'
  }
  return false
}

export function verboseLog(...args: unknown[]): void {
  if (isVerbose()) {
    console.log('[FLUID]', ...args)
  }
}

