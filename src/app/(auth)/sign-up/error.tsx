'use client';

import { getErrorMessage } from '@/lib/getErrorMessage';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendlyMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Signup Failed</h1>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{friendlyMessage}</p>
        </div>

        <Button 
          onClick={reset}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}