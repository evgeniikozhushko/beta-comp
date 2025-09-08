'use client'

import { AuthErrorFallback } from '@/components/ui/error-boundary'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
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

  // For other errors, provide global error handling
  const friendlyMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-6 text-center bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Oops!</h1>
          <h2 className="text-xl text-gray-700 mb-4">Something went wrong</h2>
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{friendlyMessage}</p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={reset} 
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'} 
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}