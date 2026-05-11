import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI } from '@/services/api';
import '@/styles/ChatRoomPage.css';
import { io } from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { encryptMessage, decryptMessage, getStoredKey, storeEncryptionKey, importKey } from '@/utils/encryption';

const MessageBubble = memo(({ msg, isSent, senderName }) => (
  <motion.div
    className={`flex w-full px-2 sm:px-4 ${isSent ? 'justify-end' : 'justify-start'}`}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.18 }}
    layout
  >
    <div className={`message-bubble ${isSent ? 'message-sent' : 'message-received'}`}>
      {senderName && <p className="msg-sender">{senderName}</p>}
      <p className="msg-text">{msg.message || msg.encryptedMessage?.slice(0, 30) + '...'}</p>
      <p className="msg-time">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {isSent && <span style={{ marginLeft: 3, fontSize: 10 }}>&#10003;&#10003;</span>}
      </p>
    </div>
  </motion.div>
));

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, typingUsers, addTypingUser, removeTypingUser } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  
  const userId = useMemo(() => user?._id || user?.id, [user?._id, user?.id]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (isMounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isMounted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    let isConnected = false;
    let newSocket = null;

    const initSocket = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api-chat-1xj6.onrender.com/api';
        const socketUrl = apiUrl.replace(/\/api$/, '');

        if (!isMounted) return;

        try {
          const joinResp = await chatAPI.joinRoom({ roomId });
          const roomInfo = joinResp.data.chatRoom;
          if (roomInfo?.roomKey) {
            storeEncryptionKey(roomInfo.roomKey, roomId);
            const imported = await importKey(roomInfo.roomKey);
            if (isMounted) setEncryptionKey(imported);
          }
        } catch (e) {
          console.warn('Could not join room via API');
        }

        newSocket = io(socketUrl, { 
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
          if (isMounted) {
            newSocket.emit('join_room', roomId);
          }
        });

        newSocket.on('receive_message', async (data) => {
          if (!isMounted) return;
          try {
            if (data.message) {
              addMessage({ ...data, message: data.message });
              return;
            }

            const useEncryption = import.meta.env.VITE_USE_ENCRYPTION !== 'false';
            if (!useEncryption) {
              addMessage({ ...data, message: data.encryptedMessage });
              return;
            }

            const key = await getStoredKey(roomId);
            const decrypted = await decryptMessage(data.encryptedMessage, data.iv, key);
            addMessage({ ...data, message: decrypted });
          } catch (error) {
            addMessage({ ...data, message: data.encryptedMessage || data.message || 'Unable to decrypt' });
          }
        });

        newSocket.on('user_typing', (data) => {
          if (isMounted && data.userId !== user?._id) {
            addTypingUser(data.userId);
          }
        });

        newSocket.on('user_stopped_typing', (data) => {
          if (isMounted) {
            removeTypingUser(data.userId);
          }
        });

        if (isMounted) {
          socketRef.current = newSocket;
          setSocket(newSocket);
        } else {
          newSocket.disconnect();
        }
      } catch (error) {
        if (isMounted) {
          toast.error('Connection error');
        }
      }
    };

    initSocket();

    return () => {
      isConnected = false;
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [roomId, user?._id, isMounted, addMessage, addTypingUser, removeTypingUser]);

  useEffect(() => {
    const loadKey = async () => {
      try {
        const key = await getStoredKey(roomId);
        setEncryptionKey(key);
      } catch (error) {
        toast.error('Encryption initialization failed');
      }
    };
    loadKey();
  }, [roomId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getMessages(roomId, 1);
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
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, setMessages]);

  const renderMessages = useCallback(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm opacity-50">Loading messages...</div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center opacity-50">
            <div className="text-4xl mb-3">&#128172;</div>
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        </div>
      );
    }

    return messages.map((msg, idx) => {
      const currentUserId = userId || user?._id;
      const isSent = msg.senderId === currentUserId || msg.senderId === String(currentUserId);
      const senderName = isSent ? null : (msg.senderName || msg.sender || 'Unknown');

      return (
        <MessageBubble
          key={msg._id || idx}
          msg={msg}
          isSent={isSent}
          senderName={senderName}
        />
      );
    });
  }, [messages, loading, userId, user]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !socket) return;

    const useEncryption = import.meta.env.VITE_USE_ENCRYPTION !== 'false';

    try {
      if (!useEncryption) {
        socket.emit('send_message', { roomId, message: messageInput });
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
        socket.emit('send_message', { roomId, encryptedMessage: encryptedData, iv });
      }

      setMessageInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      socket.emit('stop_typing', roomId);
    } catch (error) {
      toast.error('Failed to send message');
    }
  }, [messageInput, socket, roomId, encryptionKey, user, addMessage]);

  const handleTyping = useCallback(() => {
    if (socket) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('typing', roomId);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', roomId);
      }, 2000);
    }
  }, [socket, roomId]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const autoResize = useCallback((e) => {
    setMessageInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }, []);

  return (
    <div className="chatroom-page">
      <div className="chatroom-page-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold truncate">{roomId ? roomId.slice(0, 12) + '...' : 'Chat'}</h2>
            <p className="text-xs opacity-50">End-to-end encrypted</p>
          </div>
        </div>
      </div>

      <div className="chatroom-messages-area">
        {renderMessages()}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span className="text-xs opacity-50">
              {typingUsers.length === 1 ? 'Someone is typing...' : 'Several people typing...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatroom-input-area">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="chat-input-wrapper flex-1">
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              onInput={handleTyping}
              placeholder="Type a message"
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="send-btn btn-primary"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}