import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI } from '@/services/api';
import '@/styles/ChatRoomPage.css';
import { io } from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { encryptMessage, decryptMessage, getStoredKey, storeEncryptionKey, importKey } from '@/utils/encryption';

const MessageBubble = ({ msg, isSent, senderName, senderAvatar, currentUser }) => {
  if (!msg) return null;
  
  const messageText = msg?.message || msg?.encryptedMessage || '';
  const createdAt = msg?.createdAt ? new Date(msg.createdAt) : new Date();
  const timeString = isNaN(createdAt.getTime()) 
    ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getAvatarContent = (avatar, name) => {
    if (!avatar) {
      const initial = name?.[0]?.toUpperCase() || '?';
      return <span className="sender-avatar-initials">{initial}</span>;
    }
    if (typeof avatar === 'string' && (avatar.startsWith('data:') || avatar.startsWith('http'))) {
      return <img src={avatar} alt={name || 'User'} className="sender-avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />;
    }
    const initial = name?.[0]?.toUpperCase() || '?';
    return <span className="sender-avatar-initials">{initial}</span>;
  };

  const userAvatar = currentUser?.avatar;

  return (
    <motion.div
      className={`flex w-full px-2 sm:px-4 ${isSent ? 'justify-end' : 'justify-start'} mb-1`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      layout
    >
      {!isSent && (
        <div className="message-sender-avatar flex-shrink-0 mr-2">
          {getAvatarContent(senderAvatar, senderName)}
        </div>
      )}
      <div className={`message-bubble ${isSent ? 'message-sent' : 'message-received'} max-w-[70%] sm:max-w-[60%]`}>
        {senderName && !isSent && <p className="msg-sender">{senderName}</p>}
        <p className="msg-text break-words">{messageText || '...'}</p>
        <p className="msg-time text-right">
          {timeString}
          {isSent && <span className="ml-1 text-[10px]">✓✓</span>}
        </p>
      </div>
      {isSent && userAvatar && (
        <div className="message-sender-avatar flex-shrink-0 ml-2">
          {getAvatarContent(userAvatar, currentUser?.username)}
        </div>
      )}
    </motion.div>
  );
};

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
  const [socketError, setSocketError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);
  
  const userId = useMemo(() => user?._id || user?.id, [user?._id, user?.id]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages?.length]);

  useEffect(() => {
    if (!roomId || !isMounted || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let newSocket = null;

    const initSocket = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setSocketError('Authentication required');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'https://api-chat-1xj6.onrender.com/api';
        const socketUrl = apiUrl.replace(/\/api$/, '');

        try {
          const joinResp = await chatAPI.joinRoom({ roomId });
          const roomInfo = joinResp.data.chatRoom;
          if (roomInfo?.roomKey) {
            storeEncryptionKey(roomInfo.roomKey, roomId);
            try {
              const imported = await importKey(roomInfo.roomKey);
              setEncryptionKey(imported);
            } catch (e) {
              console.warn('Key import failed:', e);
            }
          }
        } catch (e) {
          console.warn('Could not join room via API:', e?.message);
        }

        newSocket = io(socketUrl, { 
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        newSocket.on('connect', () => {
          if (isMounted && newSocket) {
            newSocket.emit('join_room', roomId);
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          if (isMounted) setSocketError('Connection failed');
        });

        newSocket.on('receive_message', async (data) => {
          if (!isMounted) return;
          try {
            const useEncryption = import.meta.env.VITE_USE_ENCRYPTION !== 'false';
            let messageText = data?.message;
            
            if (!messageText && data?.encryptedMessage && useEncryption) {
              try {
                const key = await getStoredKey(roomId);
                const decrypted = await decryptMessage(data.encryptedMessage, data.iv, key);
                messageText = decrypted;
              } catch (e) {
                messageText = data.encryptedMessage;
              }
            }
            
            addMessage({ ...data, message: messageText });
          } catch (error) {
            console.error('Message handling error:', error);
            addMessage({ ...data, message: data?.message || data?.encryptedMessage || 'Message' });
          }
        });

        newSocket.on('user_typing', (data) => {
          if (isMounted && data?.userId !== userId) {
            addTypingUser(data.userId);
          }
        });

        newSocket.on('user_stopped_typing', (data) => {
          if (isMounted) {
            removeTypingUser(data.userId);
          }
        });

        if (isMounted) {
          setSocket(newSocket);
        } else if (newSocket) {
          newSocket.disconnect();
        }
      } catch (error) {
        console.error('Socket init error:', error);
        if (isMounted) setSocketError('Connection failed');
      }
    };

    initSocket();

    return () => {
      hasInitializedRef.current = false;
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [roomId, isMounted]);

  useEffect(() => {
    if (!roomId || !isMounted) return;

    const loadKey = async () => {
      try {
        const key = await getStoredKey(roomId);
        if (key && isMounted) setEncryptionKey(key);
      } catch (error) {
        console.warn('Key load failed:', error);
      }
    };
    loadKey();
  }, [roomId, isMounted]);

  useEffect(() => {
    if (!roomId || !isMounted) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getMessages(roomId, 1);
        const messagesFromServer = response.data?.messages || [];
        
        try {
          const key = await getStoredKey(roomId);
          const decryptedMessages = await Promise.all(
            messagesFromServer.map(async (m) => {
              try {
                if (m.encryptedMessage && key) {
                  const plain = await decryptMessage(m.encryptedMessage, m.iv, key);
                  return { ...m, message: plain };
                }
                return m;
              } catch (e) {
                return m;
              }
            })
          );
          if (isMounted) setMessages(decryptedMessages);
        } catch (e) {
          if (isMounted) setMessages(messagesFromServer);
        }
      } catch (error) {
        console.error('Fetch messages error:', error);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, isMounted, setMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput?.trim() || !socket) return;

    const useEncryption = import.meta.env.VITE_USE_ENCRYPTION !== 'false';
    const text = messageInput.trim();

    try {
      if (!useEncryption || !encryptionKey) {
        socket.emit('send_message', { roomId, message: text });
      } else {
        const { iv, encryptedData } = await encryptMessage(text, encryptionKey);
        socket.emit('send_message', { roomId, encryptedMessage: encryptedData, iv });
      }

      setMessageInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      socket.emit('stop_typing', roomId);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  }, [messageInput, socket, roomId, encryptionKey]);

  const handleTyping = useCallback(() => {
    if (socket && roomId) {
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, []);

  const renderMessages = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm opacity-50">Loading messages...</div>
        </div>
      );
    }

    if (!messages || messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center opacity-50">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        </div>
      );
    }

    return (
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          if (!msg) return null;
          const currentUserId = userId || user?._id;
          const isSent = msg.senderId === currentUserId || msg.senderId === String(currentUserId);
          const senderName = isSent ? null : (msg.senderName || msg.sender || 'Unknown');
          
          return (
            <MessageBubble
              key={msg._id || `msg-${idx}`}
              msg={msg}
              isSent={isSent}
              senderName={senderName}
              senderAvatar={null}
              currentUser={user}
            />
          );
        })}
      </AnimatePresence>
    );
  };

  if (socketError) {
    return (
      <div className="chatroom-page">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{socketError}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom-page">
      <div className="chatroom-page-header px-4 py-3 flex items-center gap-3">
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

      <div className="chatroom-messages-area overflow-y-auto flex-1">
        {renderMessages()}
        {typingUsers?.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span className="text-xs opacity-50">
              {typingUsers.length === 1 ? 'Someone is typing...' : 'Several people typing...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="chatroom-input-area">
        <div className="flex items-end gap-2 max-w-3xl mx-auto px-2">
          <div className="chat-input-wrapper flex-1">
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              onInput={handleTyping}
              placeholder="Type a message"
              rows={1}
              className="w-full resize-none bg-transparent outline-none px-3 py-2"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput?.trim()}
            className="send-btn btn-primary flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}