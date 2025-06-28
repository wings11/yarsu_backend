# Yarsu Auth System Documentation

## Overview
Simple role-based authentication system with 3 roles: **User**, **Admin**, **Superadmin**

## 🔑 Role Hierarchy
- **User**: Can read own role only
- **Admin**: Can read all users + promote users to admin
- **Superadmin**: Can manage all roles (promote/demote anyone)

## 📱 Client-Side Usage

### 1. Get Current User Role
```javascript
import { getUserRole } from '@/lib/authService'

const userData = await getUserRole()
console.log(userData.role) // 'user', 'admin', or 'superadmin'
```

### 2. Check User Permissions
```javascript
// Show admin panel only to admins/superadmins
{['admin', 'superadmin'].includes(userRole) && (
  <AdminPanel />
)}

// Show different UI based on role
{userRole === 'superadmin' && <SuperAdminFeatures />}
{userRole === 'admin' && <AdminFeatures />}
{userRole === 'user' && <UserFeatures />}
```

### 3. Role-Based Styling
```javascript
// Dynamic badge colors
<span className={`badge ${
  userRole === 'superadmin' ? 'bg-purple-100 text-purple-800' :
  userRole === 'admin' ? 'bg-red-100 text-red-800' : 
  'bg-blue-100 text-blue-800'
}`}>
  {userRole.toUpperCase()}
</span>
```

## 🛠️ Adding New Features

### 1. Create Protected Route
```javascript
// In your component
const [userRole, setUserRole] = useState(null)

useEffect(() => {
  const fetchRole = async () => {
    const userData = await getUserRole()
    setUserRole(userData.role)
  }
  fetchRole()
}, [])

// Protect features
{userRole === 'admin' && <NewAdminFeature />}
```

### 2. Add New API Endpoint
```javascript
// In authController.js
export const newAdminFunction = async (req, res) => {
  // Verify token
  const { data: { user } } = await supabase.auth.getUser(token)
  
  // Check role with admin client
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!['admin', 'superadmin'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  // Your feature logic here
}
```

### 3. Add Route
```javascript
// In authRoutes.js
router.get('/auth/new-feature', newAdminFunction)
```

### 4. Client Service Function
```javascript
// In authService.js
export const callNewFeature = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/auth/new-feature`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}
```

## 🚀 Quick Start Template

```javascript
// Component with role-based features
function MyComponent() {
  const [userRole, setUserRole] = useState(null)
  
  useEffect(() => {
    getUserRole().then(data => setUserRole(data.role))
  }, [])
  
  if (!userRole) return <Loading />
  
  return (
    <div>
      <h1>Welcome {userRole}!</h1>
      
      {/* User features */}
      <UserDashboard />
      
      {/* Admin features */}
      {['admin', 'superadmin'].includes(userRole) && (
        <AdminPanel />
      )}
      
      {/* Superadmin only */}
      {userRole === 'superadmin' && (
        <SuperAdminTools />
      )}
    </div>
  )
}
```

## 🔒 CRUD Role Check Patterns

### Basic Auth Template for Controllers
```javascript
import { supabase, supabaseAdmin } from '../server.js'

// Standard auth check function
const verifyUserRole = async (token, requiredRoles = []) => {
  // Verify token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throw new Error('Invalid or expired token')
  }

  // Get user role
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError) {
    throw new Error('Failed to fetch user data')
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(userData.role)) {
    throw new Error('Insufficient permissions')
  }

  return { user, userRole: userData.role }
}
```

### CRUD Examples

#### 1. User-Only Access (READ own data)
```javascript
// GET /api/jobs/my-jobs
export const getMyJobs = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { user } = await verifyUserRole(token) // Any authenticated user

    // Get only user's own data
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error
    res.json({ jobs: data })
  } catch (error) {
    res.status(error.message.includes('token') ? 401 : 500)
       .json({ error: error.message })
  }
}
```

#### 2. Admin-Only Access (READ all data)
```javascript
// GET /api/jobs/all
export const getAllJobs = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    await verifyUserRole(token, ['admin', 'superadmin']) // Admin+ only

    // Get all data
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ jobs: data })
  } catch (error) {
    const status = error.message.includes('permissions') ? 403 : 
                   error.message.includes('token') ? 401 : 500
    res.status(status).json({ error: error.message })
  }
}
```

#### 3. User CREATE (own data only)
```javascript
// POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { user } = await verifyUserRole(token) // Any authenticated user

    const { title, description, salary } = req.body
    
    // Create with user_id automatically set
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert([{ 
        title, 
        description, 
        salary, 
        user_id: user.id  // Force user_id to current user
      }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ job: data })
  } catch (error) {
    const status = error.message.includes('token') ? 401 : 500
    res.status(status).json({ error: error.message })
  }
}
```

#### 4. User UPDATE (own data only)
```javascript
// PUT /api/jobs/:id
export const updateJob = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { user } = await verifyUserRole(token) // Any authenticated user
    const { id } = req.params
    const { title, description, salary } = req.body

    // Update only if user owns the record
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({ title, description, salary })
      .eq('id', id)
      .eq('user_id', user.id)  // Critical: only update own records
      .select()
      .single()

    if (error) throw error
    if (!data) {
      return res.status(404).json({ error: 'Job not found or access denied' })
    }

    res.json({ job: data })
  } catch (error) {
    const status = error.message.includes('token') ? 401 : 500
    res.status(status).json({ error: error.message })
  }
}
```

#### 5. Admin DELETE (any data)
```javascript
// DELETE /api/jobs/:id
export const deleteJob = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { user, userRole } = await verifyUserRole(token, ['admin', 'superadmin'])
    const { id } = req.params

    // Admin can delete any job
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ message: 'Job deleted successfully' })
  } catch (error) {
    const status = error.message.includes('permissions') ? 403 : 
                   error.message.includes('token') ? 401 : 500
    res.status(status).json({ error: error.message })
  }
}
```

#### 6. Role-Based DELETE (User own, Admin any)
```javascript
// DELETE /api/jobs/:id (smart delete)
export const smartDeleteJob = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { user, userRole } = await verifyUserRole(token) // Any authenticated user
    const { id } = req.params

    let query = supabaseAdmin.from('jobs').delete().eq('id', id)

    // If not admin, can only delete own records
    if (!['admin', 'superadmin'].includes(userRole)) {
      query = query.eq('user_id', user.id)
    }

    const { error } = await query

    if (error) throw error
    res.json({ message: 'Job deleted successfully' })
  } catch (error) {
    const status = error.message.includes('token') ? 401 : 500
    res.status(status).json({ error: error.message })
  }
}
```

## 📋 Role Permission Matrix

| Operation | User | Admin | Superadmin |
|-----------|------|-------|------------|
| Read own data | ✅ | ✅ | ✅ |
| Read all data | ❌ | ✅ | ✅ |
| Create own data | ✅ | ✅ | ✅ |
| Update own data | ✅ | ✅ | ✅ |
| Update any data | ❌ | ✅ | ✅ |
| Delete own data | ✅ | ✅ | ✅ |
| Delete any data | ❌ | ✅ | ✅ |
| Manage user roles | ❌ | ✅* | ✅ |

*Admin can only promote users to admin, not modify other admins

## 🔧 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| GET | `/api/auth/user` | Any | Get current user role |
| GET | `/api/auth/users` | Admin+ | Get all users |
| PUT | `/api/auth/users/role` | Admin+ | Update user role |

## 🔒 Security Notes

- **Frontend**: Role checks are for UI only
- **Backend**: All security validation happens server-side
- **RLS**: Database-level protection enabled
- **Service Key**: Backend bypasses RLS for admin operations
- **Always verify user_id**: Never trust client-sent user IDs
