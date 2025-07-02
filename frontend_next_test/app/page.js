'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import { supabase } from '@/lib/supabase'
import { getUserRole as fetchUserRoleFromServer } from '@/lib/authService'

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
      console.log('Fetching user role from server for:', userId)
      
      // Use server-side auth service instead of direct Supabase query
      const userData = await fetchUserRoleFromServer()
      
      console.log('Server response:', userData)
      setUserRole(userData.role || 'user')
      
    } catch (error) {
      console.error('Error fetching user role from server:', error)
      
      // Fallback to client-side query if server fails
      if (retryCount < 2) {
        console.log('Retrying with client-side query...')
        await fetchUserRoleClientSide(userId, retryCount + 1)
      } else {
        setUserRole('user')
      }
    }
  }

  // Fallback client-side method
  const fetchUserRoleClientSide = async (userId, retryCount = 0) => {
    try {
      console.log('Fetching user role from client side for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Client-side error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log('User not found, creating user record...')
          await createUserRecord(userId)
          setTimeout(() => fetchUserRoleClientSide(userId, retryCount + 1), 1000)
          return
        }
        setUserRole('user')
        return
      }

      console.log('Client-side role fetched successfully:', data?.role)
      setUserRole(data?.role || 'user')
    } catch (error) {
      console.error('Error in client-side fetch:', error)
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
    return <Login />
  }

  return (
    <div>
      <Dashboard 
        user={user} 
        userRole={userRole} 
        onSignOut={handleSignOut} 
      />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        {userRole === 'admin' || userRole === 'superadmin' ? (
          <a href="/admin/chat" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: 18
          }}>
            Go to Admin Chat
          </a>
        ) : (
          <a href="/chat" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: 18
          }}>
            Go to Chat
          </a>
        )}
      </div>
    </div>
  )
}