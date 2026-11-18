import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Camera, Clock, Lock, LogOut, MessageCircle, Plus, Settings, Users } from 'lucide-react';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI } from '@/services/api';
import { storeEncryptionKey } from '@/utils/encryption';
import RoomPasswordModal from '@/components/RoomPasswordModal';
import '@/styles/DashboardPage.css';

const EMPTY_ROOM = {
  roomName: '',
  messageExpiry: '24h',
  password: '',
  roomPicture: '',
};

const MAX_IMAGE_BYTES = 512 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('Choose a PNG, JPEG, GIF, or WebP image'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image must be 512 KB or smaller'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.readAsDataURL(file);
  });

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const chatRooms = useChatStore((state) => state.chatRooms);
  const fetchChatRooms = useChatStore((state) => state.fetchChatRooms);
  const setCurrentRoom = useChatStore((state) => state.setCurrentRoom);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState(EMPTY_ROOM);
  const [roomPicturePreview, setRoomPicturePreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [passwordRoom, setPasswordRoom] = useState(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const resetCreateForm = () => {
    setShowCreateRoom(false);
    setNewRoom(EMPTY_ROOM);
    setRoomPicturePreview(null);
  };

  const handleRoomPictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      setRoomPicturePreview(dataUrl);
      setNewRoom((previous) => ({ ...previous, roomPicture: dataUrl }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.roomName.trim()) {
      toast.error('Room name is required');
      return;
    }
    if (
      newRoom.password &&
      (newRoom.password.length < 8 || new TextEncoder().encode(newRoom.password).length > 72)
    ) {
      toast.error('Room password must be between 8 and 72 characters');
      return;
    }

    setCreating(true);
    try {
      const response = await chatAPI.createRoom(newRoom);
      const createdRoom = response.data.chatRoom;
      if (!createdRoom?.roomKey) {
        toast.error('Room was created but the encryption key was not returned');
        return;
      }

      storeEncryptionKey(createdRoom.roomKey, createdRoom.roomId);
      setCurrentRoom(createdRoom);
      toast.success('Room created');
      await fetchChatRooms();
      resetCreateForm();
      navigate(`/chat/${createdRoom.roomId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create the room');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (room, password = undefined) => {
    setJoiningRoomId(room.roomId);
    try {
      const response = await chatAPI.joinRoom({ roomId: room.roomId, password });
      const joinedRoom = response.data.chatRoom;
      if (!joinedRoom?.roomKey) {
        toast.error('The room encryption key is missing');
        return;
      }

      storeEncryptionKey(joinedRoom.roomKey, joinedRoom.roomId);
      setCurrentRoom(joinedRoom);
      setPasswordRoom(null);
      navigate(`/chat/${joinedRoom.roomId}`);
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 && room.isPrivate && !password) {
        setPasswordRoom(room);
      } else {
        toast.error(error.response?.data?.message || 'Could not join the room');
      }
    } finally {
      setJoiningRoomId(null);
      setPasswordSubmitting(false);
    }
  };

  const handleJoinRoom = (room) => {
    if (joiningRoomId) return;
    if (room.isPrivate && !room.isMember) {
      setPasswordRoom(room);
      return;
    }
    joinRoom(room);
  };

  const handlePasswordSubmit = async (password) => {
    if (!passwordRoom) return;
    setPasswordSubmitting(true);
    await joinRoom(passwordRoom, password);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const formatExpiry = (expiry) => {
    if (expiry === 'permanent') return 'Permanent';
    return expiry;
  };

  const roomBadge = (room) => {
    if (room.isPrivate) {
      return (
        <span className="room-badge">
          <Lock size={11} /> {room.isMember ? 'Private · joined' : 'Private'}
        </span>
      );
    }
    return <span className="room-badge public">Public</span>;
  };

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <div className="nav-brand">
          <span className="brand-icon" aria-hidden="true">
            <MessageCircle size={20} />
          </span>
          <span className="brand-text">RelayChat</span>
        </div>
        <div className="nav-actions">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="nav-btn"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="nav-btn logout-btn"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="chat-list-container">
          <div className="chat-list-header">
            <div>
              <h1 className="chat-list-title">Rooms</h1>
              <p className="chat-list-subtitle">Signed in as {user?.username}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateRoom((visible) => !visible)}
              className="new-chat-btn"
              aria-label={showCreateRoom ? 'Close new room form' : 'Create a new room'}
              aria-expanded={showCreateRoom}
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
              <h2 className="create-room-title">New room</h2>

              <button
                type="button"
                className="room-picture-upload"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose a room picture"
              >
                {roomPicturePreview ? (
                  <img src={roomPicturePreview} alt="" className="room-picture-preview" />
                ) : (
                  <span className="room-picture-placeholder">
                    <Camera size={24} aria-hidden="true" />
                    <span>Add room photo</span>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleRoomPictureUpload}
                className="visually-hidden"
                tabIndex={-1}
              />

              <label className="visually-hidden" htmlFor="room-name">
                Room name
              </label>
              <input
                id="room-name"
                type="text"
                value={newRoom.roomName}
                onChange={(event) =>
                  setNewRoom((previous) => ({ ...previous, roomName: event.target.value }))
                }
                placeholder="Room name"
                className="input-primary create-room-input"
                maxLength={80}
              />

              <label className="visually-hidden" htmlFor="room-expiry">
                Message expiry
              </label>
              <select
                id="room-expiry"
                value={newRoom.messageExpiry}
                onChange={(event) =>
                  setNewRoom((previous) => ({ ...previous, messageExpiry: event.target.value }))
                }
                className="input-primary create-room-select"
              >
                <option value="1h">Auto-delete after 1 hour</option>
                <option value="24h">Auto-delete after 24 hours</option>
                <option value="3d">Auto-delete after 3 days</option>
                <option value="1w">Auto-delete after 1 week</option>
                <option value="permanent">Keep messages permanently</option>
              </select>

              <label className="visually-hidden" htmlFor="room-password">
                Optional room password
              </label>
              <input
                id="room-password"
                type="password"
                value={newRoom.password}
                onChange={(event) =>
                  setNewRoom((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="Password (optional, 8–72 characters)"
                className="input-primary create-room-input"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
              />
              <p className="create-room-hint">
                Rooms without a password are public and discoverable. Private rooms require the
                password each time a new member joins.
              </p>

              <div className="create-room-actions">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating…' : 'Create room'}
                </button>
                <button type="button" onClick={resetCreateForm} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          <div className="chat-list">
            {chatRooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">
                  <MessageCircle size={36} />
                </div>
                <p className="empty-title">No rooms yet</p>
                <p className="empty-desc">Create a public or private room to start messaging.</p>
              </div>
            ) : (
              chatRooms.map((room, index) => (
                <motion.div
                  key={room._id}
                  className="room-card"
                  onClick={() => handleJoinRoom(room)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${room.roomName}${room.isPrivate ? ', private room' : ''}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleJoinRoom(room);
                    }
                  }}
                >
                  <div className="room-avatar" aria-hidden="true">
                    {room.roomPicture ? (
                      <img src={room.roomPicture} alt="" className="room-avatar-img" />
                    ) : (
                      <span>{room.roomName?.[0]?.toUpperCase() || '#'}</span>
                    )}
                  </div>
                  <div className="room-info">
                    <div className="room-top">
                      <span className="room-name">{room.roomName}</span>
                      <span className="room-meta">
                        <Clock size={12} aria-hidden="true" />
                        {formatExpiry(room.messageExpiry)}
                      </span>
                    </div>
                    <div className="room-bottom">
                      <span className="room-id">ID: {room.roomId?.slice(0, 8)}…</span>
                      <span className="room-participants">
                        <Users size={12} aria-hidden="true" /> {room.participantCount || 0}
                      </span>
                    </div>
                    {roomBadge(room)}
                  </div>
                  <div className="room-arrow" aria-hidden="true">
                    &rsaquo;
                  </div>
                  {joiningRoomId === room.roomId && (
                    <span className="room-joining" aria-label="Joining room">
                      Joining…
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {passwordRoom && (
        <RoomPasswordModal
          roomName={passwordRoom.roomName}
          loading={passwordSubmitting}
          onClose={() => setPasswordRoom(null)}
          onSubmit={handlePasswordSubmit}
        />
      )}
    </div>
  );
}
