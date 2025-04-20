import AuthForm from './auth-form'

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-white">Login to Errly</h2>
        <AuthForm />
      </div>
    </div>
  )
} 