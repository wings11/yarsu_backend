"use client";
import { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:3000";

export default function AdminChatList({ token, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChats();
    // Optionally, add polling or websocket for real-time updates
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let data = await res.json();
    if (!Array.isArray(data)) data = [];
    setChats(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 350, border: "1px solid #ccc", borderRadius: 8, padding: 12, background: "#fff" }}>
      <h4 style={{ marginBottom: 12 }}>User Chats</h4>
      {loading ? (
        <div>Loading...</div>
      ) : chats.length === 0 ? (
        <div>No user chats yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {chats.map((chat) => (
            <li key={chat.id} style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => onSelectChat(chat)}>
              <b>{chat.users?.email || chat.user_id}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
