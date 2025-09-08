'use client'

import { AuthErrorFallback } from '@/components/ui/error-boundary'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { Button } from '@/components/ui/button'

export default function EventsError({
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

  // For other errors, provide events-specific error handling
  const friendlyMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Events Error</h1>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{friendlyMessage}</p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Reload Events
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}