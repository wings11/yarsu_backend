'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import AdminPanel from '@/components/AdminPanel'
import { supabase } from '@/lib/supabase'
import ChatTest from './ChatTest'
import AdminChatList from './AdminChatList'

export default function Dashboard({ user, userRole, onSignOut }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAccessToken(session?.access_token || '');
    };
    getToken();
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getToken();
    });
    return () => subscription.unsubscribe();
  }, []);

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
                    userRole === 'superadmin' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : userRole === 'admin' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {userRole.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Yarsu Dashboard</h1>
          <p className="text-gray-600 mb-6">
            You are logged in as a <strong>{userRole}</strong>
          </p>
        </div>

        {['admin', 'superadmin'].includes(userRole) && (
          <div className="mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-amber-800">
                    {userRole === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
                  </h3>
                  <p className="text-amber-700">
                    {userRole === 'superadmin' 
                      ? 'You have super administrator privileges and can manage all users and roles.' 
                      : 'You have administrator privileges and can manage users below.'}
                  </p>
                </div>
              </div>
            </div>
            <AdminPanel />
          </div>
        )}

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

        {['admin', 'superadmin'].includes(userRole) ? (
          <div style={{ display: 'flex', gap: 32 }}>
            <AdminChatList token={accessToken} onSelectChat={setSelectedChat} />
            <div style={{ flex: 1 }}>
              {selectedChat ? (
                <ChatTest chatId={selectedChat.id} token={accessToken} />
              ) : (
                <div style={{ marginTop: 40, color: '#888' }}>Select a user chat to view messages.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ChatTest chatId={user.id} token={accessToken} />
          </div>
        )}
      </main>
    </div>
  )
}
