// Legacy Pages Router app component to satisfy Next.js 15.x requirements
// This prevents routing conflicts between Pages Router and App Router

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}