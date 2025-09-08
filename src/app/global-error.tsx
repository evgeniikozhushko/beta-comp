'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#f9f9f9' }}>
          <div style={{ maxWidth: '400px', textAlign: 'center', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ marginBottom: '1rem', color: '#666' }}>{error.message}</p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '1rem' }}>Error ID: {error.digest}</p>
            )}
            <button 
              onClick={reset}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}