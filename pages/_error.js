// Legacy Pages Router error page to satisfy Next.js 15.x requirements
// This prevents routing conflicts between Pages Router and App Router

export default function Error({ statusCode }) {
  return (
    <div>
      <h1>
        {statusCode
          ? `A ${statusCode} error occurred on server`
          : 'An error occurred on client'}
      </h1>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}