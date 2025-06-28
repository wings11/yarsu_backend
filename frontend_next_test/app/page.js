'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import AuthComponent from '@/components/Auth'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user ? 'User present' : 'No user')
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserRole(null)
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      await testDatabaseConnection()
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserRole(session.user.id)
      }
    } catch (error) {
      console.error('Error initializing auth:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...')
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('Database connection test failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      } else {
        console.log('Database connection successful')
      }
    } catch (error) {
      console.error('Database connection test failed:', error.message)
      throw error
    }
  }

  const fetchUserRole = async (userId, retryCount = 0) => {
    try {
      console.log('Fetching user role for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      console.log('Query result:', { data, error })

      if (error) {
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log('User not found, creating user record...')
          await createUserRecord(userId)
          setTimeout(() => fetchUserRole(userId, retryCount + 1), 1000)
          return
        }
        setUserRole('user')
        return
      }

      console.log('Role fetched successfully:', data?.role)
      setUserRole(data?.role || 'user')
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('user')
    }
  }

  const createUserRecord = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .insert([{ id: userId, email: user.email, role: 'user' }])
        .select()

      if (error) throw error
    } catch (error) {
      console.error('Error creating user record:', error.message)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('Signing out...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase sign out error:', error)
        throw error
      }
      
      // Clear state immediately - the auth state change listener will also handle this
      setUser(null)
      setUserRole(null)
      setLoading(false)
      
      console.log('Sign out successful')
      
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Yarsu Logo"
                width={120}
                height={25}
                priority
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{user.email}</span>
                {userRole && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    userRole === 'admin' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {userRole.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === 'admin' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-amber-800">Admin Panel</h3>
                <p className="text-amber-700">You have administrator privileges and can access all features.</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Yarsu Dashboard</h1>
          <p className="text-gray-600 mb-6">Your account is set up and ready to go. Start exploring the features available to you.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
              <p className="text-sm text-gray-600 mb-3">Manage your account settings</p>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">View Profile →</button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600 mb-3">Access your main dashboard</p>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Open Dashboard →</button>
            </div>
            {userRole === 'admin' && (
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Admin Tools</h3>
                <p className="text-sm text-gray-600 mb-3">Manage users and settings</p>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Admin Panel →</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-600">{user.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-gray-600">{userRole || 'Loading...'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">User ID:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs">{user.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Sign In:</span>
              <span className="ml-2 text-gray-600">{new Date(user.last_sign_in_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}