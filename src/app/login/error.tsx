'use client'

import { getErrorMessage } from '@/lib/getErrorMessage'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const friendlyMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Login Failed</h1>
          <p className="text-gray-600">There was a problem accessing the login page.</p>
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{friendlyMessage}</p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/sign-in'} 
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}