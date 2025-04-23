import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-red-800 p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Error</h1>
        <p className="mb-6">Something went wrong during the authentication process.</p>
        <p className="mb-6">This could be due to an expired link, an invalid code, or a configuration issue.</p>
        <Link href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition duration-200 ease-in-out">
          Return to Login
        </Link>
      </div>
    </div>
  )
} 