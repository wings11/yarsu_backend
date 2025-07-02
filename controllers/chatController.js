import { supabase, supabaseAdmin } from "../server.js";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Get all chats (admins see all, users see their own)
async function getChats(req, res) {
  const { role, id } = req.user;
  try {
    if (role === 'user') {
      // User: only see their own chat
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', id)
        .single();
      if (error) {
        console.error('User getChats error:', error);
        return res.status(400).json({ error });
      }
      return res.json([chats]);
    } else {
      // Admin: see all chats (no join)
      const { data: chats, error } = await supabaseAdmin
        .from('chats')
        .select('*');
      if (error) {
        console.error('Admin getChats error:', error);
        return res.status(400).json({ error });
      }
      return res.json(chats);
    }
  } catch (err) {
    console.error('getChats unexpected error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Get messages for a chat
async function getMessages(req, res) {
  const { chatId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Send a message (user)
async function sendMessage(req, res) {
  try {
    let { chat_id, message, type = 'text' } = req.body;
    const { id } = req.user;
    let file_url = null;
    let finalType = type;

    // If no chat_id, create/find chat for this user
    if (!chat_id) {
      // Try to find existing chat
      let { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', id)
        .single();
      if (!chat) {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert([{ user_id: id }])
          .select()
          .single();
        if (createError) return res.status(500).json({ error: createError.message });
        chat_id = newChat.id;
      } else {
        chat_id = chat.id;
      }
    }

    if (req.file) {
      // Determine file extension and type
      const ext = path.extname(req.file.originalname).toLowerCase();
      let folder = 'other';
      if (type === 'image') folder = 'images';
      else if (type === 'video') folder = 'videos';
      else if (type === 'audio') folder = 'audio';
      // Generate unique file name
      const fileName = `${folder}/${uuidv4()}${ext}`;
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (uploadError) return res.status(500).json({ error: uploadError.message });
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(fileName);
      file_url = publicUrlData.publicUrl;
      finalType = type;
    }

    // Insert message
    const { data, error } = await supabase.from('messages').insert([
      {
        chat_id,
        sender_id: id,
        message: message || null,
        type: finalType,
        file_url,
      },
    ]).select().single(); // Ensure we get the inserted row
    if (error) return res.status(400).json({ error });
    // Always return chat_id for frontend
    res.json({ chat_id, message: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Reply to a message (admin)
async function replyMessage(req, res) {
  try {
    const { chat_id, message, type = 'text' } = req.body;
    const { id, role } = req.user;
    if (role === 'user') return res.status(403).json({ error: 'Forbidden' });
    let file_url = null;
    let finalType = type;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      let folder = 'other';
      if (type === 'image') folder = 'images';
      else if (type === 'video') folder = 'videos';
      else if (type === 'audio') folder = 'audio';
      const fileName = `${folder}/${uuidv4()}${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (uploadError) return res.status(500).json({ error: uploadError.message });
      const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(fileName);
      file_url = publicUrlData.publicUrl;
      finalType = type;
    }

    const { data, error } = await supabase.from('messages').insert([
      {
        chat_id,
        sender_id: id,
        message: message || null,
        type: finalType,
        file_url,
      },
    ]);
    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export { getChats, getMessages, sendMessage, replyMessage };
