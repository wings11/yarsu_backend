"use client";
import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "http://localhost:3000";

export default function ChatTest({ chatId, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  const fetchMessages = async () => {
    setLoading(true);
    if (!token) {
      console.warn('No token provided to ChatTest!');
    }
    console.log('Fetching messages with token:', token);
    const res = await fetch(`${BACKEND_URL}/api/messages/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Fetch messages error:', res.status, error);
    }
    let data = await res.json().catch(() => []);
    if (!Array.isArray(data)) data = [];
    setMessages(data);
    setLoading(false);
    scrollToBottom();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!token) {
      console.warn('No token provided to ChatTest!');
    }
    const body = { chat_id: chatId, message: input, type: "text" };
    console.log('Sending message with token:', token, 'body:', body);
    const res = await fetch(`${BACKEND_URL}/api/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Send message error:', res.status, error);
    }
    setInput("");
    fetchMessages();
  };

  // Only show reply form if admin
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('role')?.includes('admin');

  const sendAdminReply = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!token) return;
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('message', input);
    form.append('type', 'text');
    await fetch(`${BACKEND_URL}/api/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    setInput("");
    fetchMessages();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
      <h3>Chat Test</h3>
      <div style={{ height: 300, overflowY: "auto", background: "#fafafa", marginBottom: 8, padding: 8 }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ margin: "8px 0" }}>
              <b>{msg.sender?.email || msg.sender_id}:</b> {msg.message}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={isAdmin ? sendAdminReply : sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>Send</button>
      </form>
    </div>
  );
}
