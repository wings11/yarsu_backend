'use client'

import { useState, useEffect } from 'react'
import { getAllUsers, updateUserRole, getUserRole } from '@/lib/authService'

// Component to handle role change actions based on current user's permissions
function RoleActions({ user, onRoleChange, updating, currentUserRole }) {
  const isUpdating = updating[user.id]
  
  // Superadmin can change anyone to any role
  if (currentUserRole === 'superadmin') {
    return (
      <div className="flex space-x-2">
        {user.role === 'user' && (
          <>
            <button
              onClick={() => onRoleChange(user.id, 'admin')}
              disabled={isUpdating}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Make Admin'}
            </button>
            <button
              onClick={() => onRoleChange(user.id, 'superadmin')}
              disabled={isUpdating}
              className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Make Superadmin'}
            </button>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <button
              onClick={() => onRoleChange(user.id, 'user')}
              disabled={isUpdating}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Make User'}
            </button>
            <button
              onClick={() => onRoleChange(user.id, 'superadmin')}
              disabled={isUpdating}
              className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Make Superadmin'}
            </button>
          </>
        )}
        {user.role === 'superadmin' && (
          <>
            <button
              onClick={() => onRoleChange(user.id, 'admin')}
              disabled={isUpdating}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Make Admin'}
            </button>
            <button
              onClick={() => onRoleChange(user.id, 'user')}
              disabled={isUpdating}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Make User'}
            </button>
          </>
        )}
      </div>
    )
  }
  
  // Admin can only manage users (not other admins or superadmins)
  if (currentUserRole === 'admin' && user.role === 'user') {
    return (
      <button
        onClick={() => onRoleChange(user.id, 'admin')}
        disabled={isUpdating}
        className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Updating...' : 'Make Admin'}
      </button>
    )
  }
  
  // Admin cannot modify other admins or superadmins
  if (currentUserRole === 'admin' && ['admin', 'superadmin'].includes(user.role)) {
    return (
      <span className="text-gray-400 text-xs">No permission</span>
    )
  }
  
  return null
}

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
    fetchCurrentUserRole()
  }, [])

  const fetchCurrentUserRole = async () => {
    try {
      const userData = await getUserRole()
      setCurrentUserRole(userData.role)
    } catch (error) {
      console.error('Error fetching current user role:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const usersData = await getAllUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdating({ ...updating, [userId]: true })
      setError(null)
      
      await updateUserRole(userId, newRole)
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      console.log('Role updated successfully')
    } catch (error) {
      console.error('Error updating role:', error)
      setError(error.message)
    } finally {
      setUpdating({ ...updating, [userId]: false })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={fetchUsers}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'superadmin' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : user.role === 'admin' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <RoleActions 
                    user={user} 
                    onRoleChange={handleRoleChange} 
                    updating={updating}
                    currentUserRole={currentUserRole}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  )
}
