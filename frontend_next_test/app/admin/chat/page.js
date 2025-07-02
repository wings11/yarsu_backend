"use client";
import React, { useState, useEffect } from "react";
import AdminChatList from "../../../components/AdminChatList";
import ChatTest from "../../../components/ChatTest";
import { getAuthToken, getUserRole } from "../../../lib/authService";

export default function AdminChatPage() {
  const [role, setRole] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const t = await getAuthToken();
        setToken(t || "");
        if (!t) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }
        const user = await getUserRole();
        setRole(user?.role || "user");
        if (user?.role !== "admin" && user?.role !== "superadmin") {
          setError("Forbidden: Only admins can access this page.");
        }
      } catch (e) {
        setError("Failed to fetch user role. Please log in.");
      }
      setLoading(false);
    };
    fetchAuth();
  }, []);

  if (loading) return <div style={{ textAlign: "center", marginTop: 40 }}>Loading...</div>;
  if (error) return <div style={{ textAlign: "center", marginTop: 40, color: "red" }}>{error}</div>;

  return (
    <div style={{ display: "flex", maxWidth: 900, margin: "40px auto", gap: 24 }}>
      <div style={{ flex: 1 }}>
        <AdminChatList token={token} onSelectChat={setSelectedChat} />
      </div>
      <div style={{ flex: 2 }}>
        {selectedChat ? (
          <ChatTest chatId={selectedChat.id} token={token} />
        ) : (
          <div style={{ textAlign: "center", marginTop: 100, color: "#888" }}>Select a chat to view messages</div>
        )}
      </div>
    </div>
  );
}
