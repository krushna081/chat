import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI } from '@/services/api';
import { storeEncryptionKey, importKey } from '@/utils/encryption';
import { LogOut, Settings, Plus, Lock, Users, Clock, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import '@/styles/DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { chatRooms, fetchChatRooms, setCurrentRoom } = useChatStore();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', messageExpiry: '24h', password: '', roomPicture: '' });
  const [loading, setLoading] = useState(false);
  const [roomPicturePreview, setRoomPicturePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const expiryOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '3d', label: '3 Days' },
    { value: '1w', label: '1 Week' },
    { value: 'permanent', label: 'Permanent' },
  ];

  const formatExpiry = (expiry) => {
    if (expiry === 'permanent') return 'Permanent';
    if (expiry === '1h') return '1h';
    if (expiry === '24h') return '24h';
    if (expiry === '3d') return '3d';
    if (expiry === '1w') return '1w';
    return expiry;
  };

  const handleRoomPictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRoomPicturePreview(reader.result);
      setNewRoom({ ...newRoom, roomPicture: reader.result });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const handleCreateRoom = async () => {
    if (!newRoom.roomName.trim()) {
      toast.error('Room name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await chatAPI.createRoom(newRoom);
      const createdRoom = response.data.chatRoom;
      if (createdRoom?.roomKey) {
        storeEncryptionKey(createdRoom.roomKey, createdRoom.roomId);
        try { await importKey(createdRoom.roomKey); } catch (e) {}
      }
      toast.success('Room created!');
      await fetchChatRooms();
      setShowCreateRoom(false);
      setNewRoom({ roomName: '', messageExpiry: '24h', password: '' });
      navigate(`/chat/${response.data.chatRoom.roomId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room) => {
    try {
      if (room.password) {
        const pw = window.prompt('This room is password protected. Enter password:');
        if (!pw) {
          toast.error('Password required to join this room');
          return;
        }
        try {
          const resp = await chatAPI.joinRoom({ roomId: room.roomId, password: pw });
          const joinedRoom = resp.data.chatRoom;
          if (joinedRoom?.roomKey) {
            storeEncryptionKey(joinedRoom.roomKey, joinedRoom.roomId);
            try { await importKey(joinedRoom.roomKey); } catch (e) {}
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Invalid room password');
          return;
        }
      } else {
        try {
          const resp = await chatAPI.joinRoom({ roomId: room.roomId });
          const joinedRoom = resp.data.chatRoom;
          if (joinedRoom?.roomKey) {
            storeEncryptionKey(joinedRoom.roomKey, joinedRoom.roomId);
            try { await importKey(joinedRoom.roomKey); } catch (e) {}
          }
        } catch (err) {}
      }

      setCurrentRoom({ roomId: room.roomId });
      navigate(`/chat/${room.roomId}`);
    } catch (error) {
      toast.error('Failed to join room');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="brand-icon">&#128274;</span>
          <span className="brand-text">SecureChat</span>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/settings')} className="nav-btn" aria-label="Settings">
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="nav-btn logout-btn" aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="chat-list-container">
          <div className="chat-list-header">
            <h2 className="chat-list-title">Chats</h2>
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="new-chat-btn"
              aria-label="Create new chat"
            >
              <Plus size={20} />
            </button>
          </div>

          {showCreateRoom && (
            <motion.div
              className="create-room-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="create-room-title">New Chat Room</h3>
              
              {/* Room Picture Upload */}
              <div className="room-picture-upload" onClick={() => fileInputRef.current?.click()}>
                {roomPicturePreview ? (
                  <img src={roomPicturePreview} alt="Room" className="room-picture-preview" />
                ) : (
                  <div className="room-picture-placeholder">
                    <Camera size={24} />
                    <span>Add Room Photo</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRoomPictureUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <input
                type="text"
                value={newRoom.roomName}
                onChange={(e) => setNewRoom({ ...newRoom, roomName: e.target.value })}
                placeholder="Room name"
                className="input-primary create-room-input"
              />
              <select
                value={newRoom.messageExpiry}
                onChange={(e) => setNewRoom({ ...newRoom, messageExpiry: e.target.value })}
                className="input-primary create-room-select"
              >
                {expiryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === 'permanent' ? 'Permanent' : `Auto-delete after ${opt.label.toLowerCase()}`}
                  </option>
                ))}
              </select>
              <input
                type="password"
                value={newRoom.password}
                onChange={(e) => setNewRoom({ ...newRoom, password: e.target.value })}
                placeholder="Password (optional)"
                className="input-primary create-room-input"
              />
              <div className="create-room-actions">
                <button onClick={handleCreateRoom} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => { 
                  setShowCreateRoom(false); 
                  setNewRoom({ roomName: '', messageExpiry: '24h', password: '', roomPicture: '' });
                  setRoomPicturePreview(null);
                }} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          <div className="chat-list">
            {chatRooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#128172;</div>
                <p className="empty-title">No chats yet</p>
                <p className="empty-desc">Create a new chat room to start messaging</p>
              </div>
            ) : (
              chatRooms.map((room, idx) => (
                <motion.div
                  key={room._id}
                  className="room-card"
                  onClick={() => handleJoinRoom(room)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom(room)}
                >
                  <div className="room-avatar">
                    {room.roomPicture ? (
                      <img src={room.roomPicture} alt={room.roomName} className="room-avatar-img" />
                    ) : (
                      <span>{room.roomName?.[0]?.toUpperCase() || '#'}</span>
                    )}
                  </div>
                  <div className="room-info">
                    <div className="room-top">
                      <span className="room-name">{room.roomName}</span>
                      <span className="room-meta">
                        <Clock size={12} />
                        {formatExpiry(room.messageExpiry)}
                      </span>
                    </div>
                    <div className="room-bottom">
                      <span className="room-id">ID: {room.roomId?.slice(0, 8)}...</span>
                      <span className="room-participants">
                        <Users size={12} /> {room.participants?.length || 0}
                      </span>
                    </div>
                    {room.password && (
                      <span className="room-badge">
                        <Lock size={11} /> Private
                      </span>
                    )}
                  </div>
                  <div className="room-arrow">&rsaquo;</div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}