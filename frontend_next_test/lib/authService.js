import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Get auth token for API requests
export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

// Get current user role from server
export const getUserRole = async () => {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch user role')
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Error fetching user role:', error)
    throw error
  }
}

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch users')
    }

    const data = await response.json()
    return data.users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

// Update user role (admin only)
export const updateUserRole = async (userId, newRole) => {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/auth/users/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, newRole })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update user role')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}
