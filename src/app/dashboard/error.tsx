'use client'

import { AuthErrorFallback } from '@/components/ui/error-boundary'
import { getErrorMessage } from '@/lib/getErrorMessage'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Check if this is an authentication-related error
  const isAuthError = error.message.includes('auth') || 
                     error.message.includes('session') ||
                     error.message.includes('token') ||
                     error.message.includes('permission')

  if (isAuthError) {
    return <AuthErrorFallback error={error} reset={reset} />
  }

  // For other errors, provide generic dashboard error handling
  const friendlyMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Dashboard Error</h1>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{friendlyMessage}</p>
        </div>

        <button 
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  )
}