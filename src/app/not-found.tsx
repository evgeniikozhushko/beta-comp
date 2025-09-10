import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
        <p style={{ marginBottom: '1rem', color: '#666' }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link 
          href="/" 
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}