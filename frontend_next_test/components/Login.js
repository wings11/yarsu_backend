'use client'

import AuthComponent from '@/components/Auth'

export default function Login() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Welcome to Yarsu</h1>
        <p className="text-center text-gray-600 mb-8">Please sign in to continue</p>
        <AuthComponent />
      </div>
    </div>
  )
}
