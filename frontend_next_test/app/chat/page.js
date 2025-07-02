"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ChatPage() {
  const router = useRouter();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get token and user id from Supabase session
    getAuthToken().then(async t => {
      setToken(t || '');
      if (t) {
        // Get user id from supabase
        const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser(t));
        setCurrentUserId(user?.id || null);
      }
    });
  }, []);

  if (!token) {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Please log in to use the chat.</h2>
        <p>Return to the home page to sign in.</p>
      </div>
    );
  }

  const startChat = async () => {
    setLoading(true);
    try {
      // Always send 'hi' as the first message
      const form = new FormData();
      form.append('message', 'hi');
      form.append('type', 'text');
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      });
      const data = await res.json();
      console.log('Start chat response:', data); // Debug log
      if (data && data.chat_id) {
        setChatId(data.chat_id);
        fetchMessages(data.chat_id);
      } else if (data && data.id) {
        setChatId(data.id);
        fetchMessages(data.id);
      } else {
        alert('Failed to start chat.');
      }
    } catch (e) {
      alert('Error starting chat.');
    }
    setLoading(false);
  };

  const fetchMessages = async (cid = chatId) => {
    if (!cid) return;
    const res = await fetch(`${API_BASE_URL}/messages/${cid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('message', input);
    form.append('type', 'text');
    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    });
    setInput('');
    fetchMessages();
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Chat with Admin</h2>
      {!chatId ? (
        <button onClick={startChat} disabled={loading} style={{ padding: '10px 20px', fontSize: 16 }}>
          {loading ? 'Starting...' : 'Chat with Admin'}
        </button>
      ) : (
        <>
          <div style={{ minHeight: 200, maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', marginBottom: 10, padding: 10 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 8, textAlign: msg.sender_id === currentUserId ? 'right' : 'left' }}>
                <span style={{ background: msg.sender_id === currentUserId ? '#000' : '#000', padding: 6, borderRadius: 6 }}>
                  <b>{msg.sender_id === currentUserId ? 'You' : 'Admin'}:</b> {msg.message}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: 8 }}
            />
            <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
          </form>
        </>
      )}
    </div>
  );
}
