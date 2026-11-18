import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Lock, Send } from 'lucide-react';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI, getSocketUrl } from '@/services/api';
import {
  decryptMessage,
  encryptMessage,
  getStoredKey,
  importKey,
  storeEncryptionKey,
} from '@/utils/encryption';
import RoomPasswordModal from '@/components/RoomPasswordModal';
import '@/styles/ChatRoomPage.css';

const MessageBubble = ({ msg, isSent, currentUser }) => {
  if (!msg) return null;

  const messageText = msg.message ?? (msg.decryptionFailed ? 'Message unavailable' : '…');
  const createdAt = msg.createdAt ? new Date(msg.createdAt) : new Date();
  const timeString = Number.isNaN(createdAt.getTime())
    ? ''
    : createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const avatar = isSent ? currentUser?.avatar : msg.senderAvatar;
  const senderName = isSent ? currentUser?.username : msg.senderName;

  const renderAvatar = () => {
    if (avatar && (avatar.startsWith('data:') || avatar.startsWith('https://'))) {
      return <img src={avatar} alt="" className="sender-avatar-img" />;
    }
    return <span className="sender-avatar-initials">{senderName?.[0]?.toUpperCase() || '?'}</span>;
  };

  return (
    <motion.div
      className={`flex w-full px-2 sm:px-4 ${isSent ? 'justify-end' : 'justify-start'} mb-1`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      layout
    >
      {!isSent && (
        <div className="message-sender-avatar flex-shrink-0 mr-2" aria-hidden="true">
          {renderAvatar()}
        </div>
      )}
      <div
        className={`message-bubble ${isSent ? 'message-sent' : 'message-received'} ${
          msg.decryptionFailed ? 'message-unavailable' : ''
        } max-w-[70%] sm:max-w-[60%]`}
      >
        {!isSent && <p className="msg-sender">{msg.senderName || 'Unknown'}</p>}
        <p className="msg-text break-words">{messageText}</p>
        <p className="msg-time text-right">
          {timeString}
          {isSent && (
            <span className="ml-1 text-[10px]">{msg.deliveryStatus === 'read' ? '✓✓' : '✓'}</span>
          )}
        </p>
      </div>
      {isSent && (
        <div className="message-sender-avatar flex-shrink-0 ml-2" aria-hidden="true">
          {renderAvatar()}
        </div>
      )}
    </motion.div>
  );
};

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);
  const clearTypingUsers = useChatStore((state) => state.clearTypingUsers);

  const [roomInfo, setRoomInfo] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [socketError, setSocketError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userId = useMemo(() => String(user?._id || user?.id || ''), [user]);

  const joinRoom = useCallback(
    async (password = undefined) => {
      setJoinError(null);
      try {
        const response = await chatAPI.joinRoom({ roomId, password });
        const room = response.data.chatRoom;
        if (!room?.roomKey) throw new Error('The room encryption key is missing');

        storeEncryptionKey(room.roomKey, roomId);
        const key = await importKey(room.roomKey);
        setEncryptionKey(key);
        setRoomInfo(room);
        setNeedsPassword(false);
        setJoined(true);
      } catch (error) {
        const message = error.response?.data?.message || error.message;
        const passwordError =
          error.response?.status === 403 &&
          (message === 'Password required' || message === 'Invalid room password');
        if (passwordError) {
          setNeedsPassword(true);
          if (message === 'Invalid room password') {
            toast.error(message);
          }
        } else {
          setJoinError(message || 'Could not join this room');
        }
      } finally {
        setJoining(false);
        setPasswordSubmitting(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    setJoined(false);
    setRoomInfo(null);
    setNeedsPassword(false);
    setJoinError(null);
    setEncryptionKey(null);
    setMessageInput('');
    setMessages([]);
    clearTypingUsers();
    setJoining(true);
    joinRoom();
  }, [clearTypingUsers, joinRoom, setMessages]);

  useEffect(() => {
    if (!joined || !roomId) return undefined;

    const socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10_000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketError(null);
      socket.emit('join_room', roomId);
    });

    socket.on('connect_error', (error) => {
      setSocketError(
        error.message === 'Authentication required'
          ? 'Your session expired. Sign in again to reconnect.'
          : 'Live connection unavailable. Messages may not update.'
      );
    });

    socket.on('app_error', (data) => {
      toast.error(data?.message || 'The room rejected that action');
    });

    socket.on('receive_message', async (data) => {
      let text = null;
      let decryptionFailed = false;
      try {
        const key = await getStoredKey(roomId);
        if (!key) throw new Error('Missing key');
        text = await decryptMessage(data.encryptedMessage, data.iv, key);
      } catch {
        decryptionFailed = true;
      }
      addMessage({ ...data, message: text, decryptionFailed });
    });

    socket.on('user_typing', (data) => {
      if (data?.userId && String(data.userId) !== userId) addTypingUser(data.userId);
    });

    socket.on('user_stopped_typing', (data) => {
      if (data?.userId) removeTypingUser(data.userId);
    });

    socket.on('disconnect', clearTypingUsers);

    return () => {
      clearTypingUsers();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clearTypingUsers, joined, roomId, userId, addMessage, addTypingUser, removeTypingUser]);

  useEffect(() => {
    if (!joined || !roomId) return undefined;

    let cancelled = false;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await chatAPI.getMessages(roomId, 1);
        const serverMessages = response.data?.messages || [];
        const key = await getStoredKey(roomId);

        const decryptedMessages = await Promise.all(
          serverMessages.map(async (message) => {
            try {
              if (!key) throw new Error('Missing key');
              const text = await decryptMessage(message.encryptedMessage, message.iv, key);
              return { ...message, message: text, decryptionFailed: false };
            } catch {
              return { ...message, message: null, decryptionFailed: true };
            }
          })
        );

        if (!cancelled) setMessages(decryptedMessages);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.response?.data?.message || 'Could not load messages');
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [joined, roomId, setMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      messagesEndRef.current.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'end',
      });
    }
  }, [messages.length]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    []
  );

  const handlePasswordSubmit = async (password) => {
    setPasswordSubmitting(true);
    await joinRoom(password);
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !encryptionKey) {
      if (!encryptionKey) toast.error('The room encryption key is not ready');
      return;
    }
    if (!socketRef.current?.connected) {
      toast.error('Live connection is not ready. Try again in a moment.');
      return;
    }

    try {
      const { iv, encryptedData } = await encryptMessage(text, encryptionKey);
      socketRef.current.emit('send_message', {
        roomId,
        encryptedMessage: encryptedData,
        iv,
      });
      setMessageInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      socketRef.current.emit('stop_typing', roomId);
    } catch {
      toast.error('Could not encrypt or send the message');
    }
  };

  const handleInput = (event) => {
    setMessageInput(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    if (socketRef.current) {
      socketRef.current.emit('typing', roomId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop_typing', roomId);
      }, 1500);
    }
  };

  const handleKeyDown = (event) => {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessages = () => {
    if (loadingMessages) {
      return (
        <div className="chatroom-status" role="status">
          <Loader2 className="animate-spin" size={18} /> Loading messages…
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="chatroom-status">
          <div className="chatroom-empty-icon" aria-hidden="true">
            💬
          </div>
          <p>No messages yet. Say hello.</p>
        </div>
      );
    }

    return (
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const senderId = String(message.senderId?._id || message.senderId || '');
          const isSent = senderId === userId;
          return (
            <MessageBubble
              key={message._id || `message-${index}`}
              msg={message}
              isSent={isSent}
              currentUser={user}
            />
          );
        })}
      </AnimatePresence>
    );
  };

  if (joining && !needsPassword) {
    return (
      <div className="chatroom-page">
        <div className="chatroom-status" role="status">
          <Loader2 className="animate-spin" size={20} /> Joining room…
        </div>
      </div>
    );
  }

  if (joinError && !needsPassword) {
    return (
      <div className="chatroom-page">
        <div className="chatroom-status">
          <p>{joinError}</p>
          <div className="chatroom-error-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setJoining(true);
                joinRoom();
              }}
            >
              Try again
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Back to rooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom-page">
      <header className="chatroom-page-header px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="chatroom-back-btn"
          aria-label="Back to rooms"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="chatroom-title">{roomInfo?.roomName || 'Chat room'}</h1>
          <p className="chatroom-subtitle">
            <Lock size={12} aria-hidden="true" />
            {roomInfo?.isPrivate ? 'Private room' : 'Public room'} · server-managed encryption
          </p>
        </div>
      </header>

      {socketError && (
        <div className="chatroom-banner" role="status">
          {socketError}
        </div>
      )}

      <div className="chatroom-messages-area overflow-y-auto flex-1">
        {renderMessages()}
        {typingUsers.length > 0 && (
          <div className="chatroom-typing" aria-live="polite">
            <div className="typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>
              {typingUsers.length === 1 ? 'Someone is typing…' : 'Several people are typing…'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="chatroom-input-area">
        <div className="chatroom-input-row">
          <div className="chat-input-wrapper">
            <label className="visually-hidden" htmlFor="message-input">
              Message
            </label>
            <textarea
              id="message-input"
              ref={textareaRef}
              value={messageInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              rows={1}
              maxLength={2000}
              className="w-full resize-none bg-transparent outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !encryptionKey}
            className="send-btn btn-primary flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {needsPassword && (
        <RoomPasswordModal
          roomName={roomInfo?.roomName || roomId}
          loading={passwordSubmitting}
          onClose={() => navigate('/dashboard')}
          onSubmit={handlePasswordSubmit}
        />
      )}
    </div>
  );
}
