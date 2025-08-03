import { supabase, supabaseAdmin } from "../server.js";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Validate UUID format
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Get all chats (admins see all, users see their own)
async function getChats(req, res) {
  const { role, id } = req.user;
  console.log('getChats - User:', { role, id });
  try {
    if (role === 'user') {
      if (!isValidUUID(id)) {
        console.log('getChats - Invalid user_id:', id);
        return res.status(400).json({ error: 'Invalid user_id format' });
      }
      // User: only see their own chat
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', id);
      if (error) {
        console.error('getChats - User query error:', error);
        return res.status(400).json({ error: error.message });
      }
      console.log('getChats - User chats:', chats);
      return res.json(chats || []);
    } else {
      // Admin: see all chats
      const { data: chats, error } = await supabaseAdmin
        .from('chats')
        .select('*');
      if (error) {
        console.error('getChats - Admin query error:', error);
        return res.status(400).json({ error: error.message });
      }
      console.log('getChats - Admin chats:', chats);
      return res.json(chats);
    }
  } catch (err) {
    console.error('getChats - Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

// Get messages for a chat
async function getMessages(req, res) {
  const { chatId } = req.params;
  console.log('getMessages - Chat ID:', chatId);
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('getMessages - Query error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.log('getMessages - Messages:', data);
    res.json(data);
  } catch (err) {
    console.error('getMessages - Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

// Send a message (user)
async function sendMessage(req, res) {
  try {
    let { chat_id, message, type = 'text' } = req.body;
    const { id } = req.user;
    console.log('sendMessage - User ID:', id, 'Chat ID:', chat_id, 'Message:', message);
    let file_url = null;
    let finalType = type;

    if (!isValidUUID(id)) {
      console.log('sendMessage - Invalid user_id:', id);
      return res.status(400).json({ error: 'Invalid user_id format' });
    }

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
        if (createError) {
          console.error('sendMessage - Create chat error:', createError);
          return res.status(500).json({ error: createError.message });
        }
        chat_id = newChat.id;
        console.log('sendMessage - Created new chat:', chat_id);
      } else {
        chat_id = chat.id;
        console.log('sendMessage - Found existing chat:', chat_id);
      }
    }

    if (req.file) {
      // Determine file extension and type
      const ext = path.extname(req.file.originalname).toLowerCase();
      let folder = 'other';
      if (type === 'image') folder = 'images';
      else if (type === 'video') folder = 'videos';
      else if (type === 'audio') folder = 'audio';
      const fileName = `${folder}/${uuidv4()}${ext}`;
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (uploadError) {
        console.error('sendMessage - File upload error:', uploadError);
        return res.status(500).json({ error: uploadError.message });
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(fileName);
      file_url = publicUrlData.publicUrl;
      finalType = type;
      console.log('sendMessage - File uploaded:', file_url);
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
    ]).select().single();
    if (error) {
      console.error('sendMessage - Insert message error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.log('sendMessage - Message inserted:', data);
    res.json({ chat_id, message: data });
  } catch (err) {
    console.error('sendMessage - Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

// Reply to a message (admin)
async function replyMessage(req, res) {
  try {
    const { chat_id, message, type = 'text' } = req.body;
    const { id, role } = req.user;
    console.log('replyMessage - User:', { id, role }, 'Chat ID:', chat_id, 'Message:', message);
    if (role === 'user') {
      console.log('replyMessage - Forbidden: User role not allowed');
      return res.status(403).json({ error: 'Forbidden' });
    }
    let file_url = null;
    let finalType = type;

    if (!isValidUUID(id)) {
      console.log('replyMessage - Invalid user_id:', id);
      return res.status(400).json({ error: 'Invalid user_id format' });
    }

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
      if (uploadError) {
        console.error('replyMessage - File upload error:', uploadError);
        return res.status(500).json({ error: uploadError.message });
      }
      const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(fileName);
      file_url = publicUrlData.publicUrl;
      finalType = type;
      console.log('replyMessage - File uploaded:', file_url);
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
    if (error) {
      console.error('replyMessage - Insert message error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.log('replyMessage - Message inserted:', data);
    res.json(data);
  } catch (err) {
    console.error('replyMessage - Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

export { getChats, getMessages, sendMessage, replyMessage };