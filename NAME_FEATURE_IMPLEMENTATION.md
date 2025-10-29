# User Name Feature Implementation Guide

## Overview
This feature adds a mandatory name field for users. After login, if a user hasn't set their name, a modal will appear prompting them to enter it.

## Backend Changes Completed ✅

### 1. Database Migration
**File:** `migrations/002_add_name_to_users.sql`

Run this SQL in your Supabase SQL Editor:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
CREATE INDEX IF NOT EXISTS users_name_idx ON public.users(name);
```

### 2. Controller Updates
**File:** `controllers/userController.js`

Added two new functions:
- `getUserProfile()` - Get user profile including name
- `updateUserName()` - Update user's name

### 3. Route Updates
**File:** `routes/authRoutes.js`

Added two new endpoints:
- `GET /api/auth/profile` - Get current user's profile (includes name)
- `PUT /api/auth/profile/name` - Update current user's name

### 4. Auth Controller Updates
**File:** `controllers/authController.js`

Modified:
- `getUserRole()` - Now returns name field
- `getAllUsers()` - Now includes name field

### 5. Middleware Updates
**File:** `middleware.js`

Modified:
- Auto-create user now includes `name: null` field

## API Endpoints

### Get User Profile
```
GET /api/auth/profile
Authorization: Bearer {token}

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe" or null
  }
}
```

### Update User Name
```
PUT /api/auth/profile/name
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "John Doe"
}

Response:
{
  "message": "Name updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe"
  }
}
```

## Frontend Implementation Required

### 1. Update User Interface Type
Add `name` field to the User interface in `src/lib/supabase.ts`:

```typescript
export interface User {
  id: string
  email: string
  role: 'member' | 'admin' | 'superadmin'
  name?: string // Add this line
}
```

### 2. Update API Service
Add methods in `src/lib/api.ts`:

```typescript
async getUserProfile() {
  return this.request('/api/auth/profile')
}

async updateUserName(name: string) {
  return this.request('/api/auth/profile/name', {
    method: 'PUT',
    body: JSON.stringify({ name })
  })
}
```

### 3. Create Name Modal Component
Create `src/components/auth/NameModal.tsx`:

```typescript
'use client'

import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface NameModalProps {
  isOpen: boolean
  onClose: () => void
  onNameSet: (name: string) => void
}

export default function NameModal({ isOpen, onClose, onNameSet }: NameModalProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    setIsSubmitting(true)
    
    try {
      await apiService.updateUserName(name.trim())
      toast.success('Name saved successfully!')
      onNameSet(name.trim())
      onClose()
    } catch (error: any) {
      console.error('Error saving name:', error)
      toast.error('Failed to save name. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl p-6">
          <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
            Welcome! 👋
          </Dialog.Title>
          
          <Dialog.Description className="text-gray-600 mb-6">
            Please tell us your name to get started.
          </Dialog.Description>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
```

### 4. Update AuthContext
Modify `src/contexts/AuthContext.tsx` to include name check:

```typescript
// Add to AuthContextType interface
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserName: (name: string) => Promise<void> // Add this
}

// Add updateUserName function in AuthProvider
const updateUserName = async (name: string) => {
  if (user) {
    setUser({ ...user, name })
  }
}

// Return updateUserName in the value
const value = {
  user,
  loading,
  signIn,
  signUp,
  signOut,
  resetPassword,
  updateUserName // Add this
}
```

### 5. Update Root Page
Modify `src/app/page.tsx` to show the modal when user has no name:

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui/Loading'
import Layout from '@/components/Layout'
import { LoginForm, SignupForm } from '@/components/auth/AuthForms'
import NameModal from '@/components/auth/NameModal'
// ... other imports

export default function RootPage() {
  const { user, loading, updateUserName } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [showNameModal, setShowNameModal] = useState(false)

  // Check if user needs to set name
  useEffect(() => {
    if (user && !user.name) {
      setShowNameModal(true)
    }
  }, [user])

  const handleNameSet = (name: string) => {
    updateUserName(name)
    setShowNameModal(false)
  }

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/images/logo.png" alt="Logo" className="h-24 w-auto" />
            </div>
            <p className="text-gray-600">Your guide to Thailand</p>
          </div>
          
          {isLoginMode ? (
            <LoginForm onToggleMode={() => setIsLoginMode(false)} />
          ) : (
            <SignupForm onToggleMode={() => setIsLoginMode(true)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <NameModal 
        isOpen={showNameModal} 
        onClose={() => {}} // Empty function prevents closing
        onNameSet={handleNameSet}
      />
      
      <Layout>
        <HomePage />
      </Layout>
    </>
  )
}
```

## Testing Checklist

### Backend Testing
- [ ] Run database migration in Supabase
- [ ] Test GET /api/auth/profile endpoint
- [ ] Test PUT /api/auth/profile/name endpoint
- [ ] Verify name is returned in getUserRole response
- [ ] Check that new users are created with name: null

### Frontend Testing
- [ ] User with no name sees modal after login
- [ ] Modal cannot be closed without entering name
- [ ] Name is saved successfully
- [ ] User interface updates with name
- [ ] Modal doesn't appear for users who already have a name
- [ ] Modal doesn't appear on subsequent logins

## Deployment Steps

1. **Database Migration**
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration SQL from `migrations/002_add_name_to_users.sql`
   - Verify the column was added: `SELECT * FROM users LIMIT 1;`

2. **Backend Deployment**
   - Backend changes are already committed
   - Deploy to Render.com (should auto-deploy if connected to git)
   - Verify API health: `https://your-api.com/api/health`

3. **Frontend Deployment**
   - Frontend changes need to be implemented (see Frontend Implementation Required section)
   - Test locally first
   - Deploy to Vercel or your hosting platform

## Notes

- Name field is nullable in database for backward compatibility
- Existing users will see the modal on their next login
- The modal is "blocking" - users must enter a name to continue
- Name validation: minimum 1 character (after trim), maximum 255 characters
- Name can be updated later through user profile settings (if you add that feature)

## Future Enhancements

- Add profile page where users can update their name
- Add name display in chat interface
- Add name to admin user management table
- Add character validation (letters, spaces, hyphens only)
- Add minimum/maximum length validation
