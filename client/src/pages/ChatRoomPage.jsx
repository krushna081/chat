import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI } from '@/services/api';
import '@/styles/ChatRoomPage.css';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { encryptMessage, decryptMessage, getStoredKey, storeEncryptionKey, importKey, retrieveEncryptionKey } from '@/utils/encryption';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, typingUsers, addTypingUser, removeTypingUser } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);

  // Initialize Socket.io
  useEffect(() => {
    const initSocket = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace(/\/api$/, '') || 'http://localhost:5000';

        // Clear previous room messages when switching rooms
        setMessages([]);

        // Ensure we join via the API to receive the roomKey for shared encryption
        try {
          const joinResp = await chatAPI.joinRoom({ roomId });
          const roomInfo = joinResp.data.chatRoom;
          if (roomInfo?.roomKey) {
            // store room key locally for this room and import it
            storeEncryptionKey(roomInfo.roomKey, roomId);
            const imported = await importKey(roomInfo.roomKey);
            setEncryptionKey(imported);
          }
        } catch (e) {
          console.warn('Could not join room via API:', e?.response?.data || e.message || e);
        }

        const newSocket = io(socketUrl, {
          auth: { token },
        });

        newSocket.on('connect', () => {
          console.log('Socket connected');
          newSocket.emit('join_room', roomId);
        });

        newSocket.on('receive_message', async (data) => {
          try {
            // If server sent a plaintext message (encryption disabled), use it directly
            if (data.message) {
              addMessage({ ...data, message: data.message });
              return;
            }

            // If encryption is disabled on client, and server didn't send plaintext, show raw encrypted
            const useEncryption = import.meta.env.VITE_USE_ENCRYPTION !== 'false';
            if (!useEncryption) {
              addMessage({ ...data, message: data.encryptedMessage });
              return;
            }

            const key = await getStoredKey(roomId);
            const decrypted = await decryptMessage(data.encryptedMessage, data.iv, key);
            addMessage({ ...data, message: decrypted });
            return;
          } catch (error) {
            console.error('Receive decryption error:', error?.message || error);
            addMessage({ ...data, message: data.encryptedMessage || data.message || 'Unable to decrypt' });
          }
        });

        newSocket.on('user_typing', (data) => {
          if (data.userId !== user?._id) {
            addTypingUser(data.userId);
          }
        });

        newSocket.on('user_stopped_typing', (data) => {
          removeTypingUser(data.userId);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Socket error:', error);
        toast.error('Connection error');
      }
    };

    initSocket();

    return () => {
      socket?.disconnect();
    };
  }, [roomId, user, addMessage, addTypingUser, removeTypingUser]);

  // Get encryption key
  useEffect(() => {
    const loadKey = async () => {
      try {
        const key = await getStoredKey(roomId);
        setEncryptionKey(key);
      } catch (error) {
        console.error('Encryption key error:', error);
        toast.error('Encryption initialization failed');
      }
    };

    loadKey();
  }, [roomId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getMessages(roomId, 1);
        // Decrypt fetched messages so UI shows plaintext to users
        const messagesFromServer = response.data.messages || [];
        try {
          const key = await getStoredKey(roomId);
          const decryptedMessages = await Promise.all(
            messagesFromServer.map(async (m) => {
              try {
                const plain = await decryptMessage(m.encryptedMessage, m.iv, key);
                return { ...m, message: plain };
              } catch (e) {
                return m;
              }
            })
          );
          setMessages(decryptedMessages);
        } catch (e) {
          setMessages(messagesFromServer);
        }
      } catch (error) {
        console.error('Fetch messages error:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, setMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !socket) return;

    const useEncryption = import.meta.env.VITE_USE_ENCRYPTION !== 'false';

    try {
      if (!useEncryption) {
        // send plaintext
        socket.emit('send_message', {
          roomId,
          message: messageInput,
        });
        // show locally
        addMessage({
          _id: `local-${Date.now()}`,
          roomId,
          senderId: user?._id,
          message: messageInput,
          createdAt: new Date().toISOString(),
          deliveryStatus: 'sent',
        });
      } else {
        if (!encryptionKey) {
          toast.error('Encryption key not ready');
          return;
        }
        const { iv, encryptedData } = await encryptMessage(messageInput, encryptionKey);
        socket.emit('send_message', {
          roomId,
          encryptedMessage: encryptedData,
          iv,
        });
      }

      setMessageInput('');
      socket.emit('stop_typing', roomId);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', roomId);
    }
  };

  return (
    <div className="chatroom-page h-screen flex flex-col bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-900">
      {/* Header */}
      <div className="glass-dark border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between hover-lift">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition hover-lift"
          >
            <ArrowLeft size={20} className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-responsive">Chat Room</h2>
            <p className="text-xs text-gray-400">{roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-cyber-100">
          <AlertCircle size={16} className="h-3 w-3" />
          <span className="text-xs">E2EE Enabled</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-responsive">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-responsive">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg._id || idx}
              className={`flex ${msg.senderId === user?._id ? 'justify-end' : 'justify-start'} px-1`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-lg ${
                  msg.senderId === user?._id
                    ? 'message-sent'
                    : 'message-received'
                }`}
              >
                <p className="text-xs mb-0.5 font-semibold">
                  {msg.senderId === user?._id ? 'You' : msg.senderId?.username || 'Unknown'}
                </p>
                <p className="text-xs break-words">{msg.message || msg.encryptedMessage?.slice(0, 30) + '...'}</p>
                <p className="text-xxs opacity-60 mt-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </motion.div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <motion.div
            className="flex justify-start px-1"
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <div className="text-xs text-gray-400">
              {typingUsers.length} user{typingUsers.length > 1 ? 's' : ''} typing...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="glass-dark border-t border-cyan-500/20 px-4 py-2 fixed-bottom-safe">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="input-primary flex-1 min-h-[44px]"
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 btn-primary font-semibold flex items-center gap-1.5 disabled:opacity-50 min-h-[44px]"
          >
            <Send size={18} className="h-4 w-4" />
          </motion.button>
        </div>
        <p className="text-xxs text-gray-500 mt-1.5 text-center">💚 All messages are end-to-end encrypted</p>
      </div>
    </div>
  );
}
