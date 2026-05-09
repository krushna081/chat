import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useChatStore } from '@/context/store';
import { chatAPI } from '@/services/api';
import { storeEncryptionKey, importKey } from '@/utils/encryption';
import { LogOut, Settings, Plus, MessageCircle, Copy, User } from 'lucide-react';
import toast from 'react-hot-toast';
import '@/styles/DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { chatRooms, fetchChatRooms, setCurrentRoom } = useChatStore();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', messageExpiry: '24h', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      // If server returned a roomKey (for encryption), store it locally for this room
      const createdRoom = response.data.chatRoom;
      if (createdRoom?.roomKey) {
        storeEncryptionKey(createdRoom.roomKey, createdRoom.roomId);
        // preload import to warm up crypto.key
        try {
          await importKey(createdRoom.roomKey);
        } catch (e) {
          // ignore import errors here; ChatRoomPage will handle key import
        }
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
      // If the room is password protected, prompt the user and verify via API
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
        // attempt to join public room (server will accept without password)
        try {
          const resp = await chatAPI.joinRoom({ roomId: room.roomId });
          const joinedRoom = resp.data.chatRoom;
          if (joinedRoom?.roomKey) {
            storeEncryptionKey(joinedRoom.roomKey, joinedRoom.roomId);
            try { await importKey(joinedRoom.roomKey); } catch (e) {}
          }
        } catch (err) {
          // If join fails, we still allow navigate which will attempt socket join
        }
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
    <div className="dashboard-page min-h-screen bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-900">
      {/* Header */}
      <nav className="glass-dark border-b border-cyan-500/20 px-4 py-3 sticky top-0 z-20 hover-lift">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-responsive cyber-glow">🔐 SecureChat</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-cyan-500/20 rounded-lg transition hover-lift"
            >
              <Settings size={20} className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 btn-secondary hover-lift"
            >
              <LogOut size={16} className="h-3 w-3" />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <motion.div
          className="glass-dark p-4 rounded-xl mb-6 hover-lift"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyber-100/20 rounded-lg">
              <User size={28} className="text-cyber-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1 text-responsive">Welcome, {user?.username || 'User'}!</h2>
              <p className="text-sm text-gray-400">Select a chat room or create a new one to start messaging securely.</p>
            </div>
          </div>
        </motion.div>

        {/* Create Room Section */}
        {showCreateRoom && (
          <motion.div
            className="glass-dark p-4 rounded-xl mb-6 hover-lift"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-bold mb-3">Create New Chat Room</h3>

            <div className="space-y-3">
              <label className="block text-xs font-medium mb-1">Room Name</label>
              <input
                type="text"
                value={newRoom.roomName}
                onChange={(e) => setNewRoom({ ...newRoom, roomName: e.target.value })}
                placeholder="Enter room name"
                className="input-primary w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium mb-1">Message Expiry</label>
              <select
                value={newRoom.messageExpiry}
                onChange={(e) => setNewRoom({ ...newRoom, messageExpiry: e.target.value })}
                className="input-primary w-full"
              >
                <option value="1h">1 Hour</option>
                <option value="12h">12 Hours</option>
                <option value="24h">24 Hours</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium mb-1">Password (Optional)</label>
              <input
                type="password"
                value={newRoom.password}
                onChange={(e) => setNewRoom({ ...newRoom, password: e.target.value })}
                placeholder="Leave empty for public room"
                className="input-primary w-full"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="flex-1 btn-primary py-2 font-semibold hover-lift"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 btn-secondary py-2 font-semibold hover-lift"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Create Button */}
        {!showCreateRoom && (
          <motion.button
            onClick={() => setShowCreateRoom(true)}
            className="w-full mb-6 px-4 py-2 btn-primary font-semibold flex items-center justify-center gap-2 hover-lift"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} className="h-3 w-3" />
            <span className="text-xs">Create New Room</span>
          </motion.button>
        )}

        {/* Chat Rooms Grid */}
        <div className="grid gap-4">
          {chatRooms.map((room, idx) => (
            <motion.div
              key={room._id}
              className="glass-dark p-4 rounded-xl cursor-pointer hover-lift hover:shadow-lg transition-all duration-200"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleJoinRoom(room)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-cyber-100 h-3 w-3" />
                  <div>
                    <h3 className="font-medium text-lg">{room.roomName}</h3>
                    <p className="text-xs text-gray-400">
                      {room.participants?.length || 0} participants
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-400">
                <p>📌 Room ID: {room.roomId.slice(0, 6)}...</p>
                <p>⏳ Messages expire in: {room.messageExpiry}</p>
                {room.password && <p>🔒 Password protected</p>}
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 btn-secondary py-1 text-xs hover-lift">
                  Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(room.roomId);
                    toast.success('Room ID copied!');
                  }}
                  className="p-1 btn-secondary hover-lift"
                >
                  <Copy size={14} className="h-2.5 w-2.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {chatRooms.length === 0 && !showCreateRoom && (
          <motion.div
            className="text-center py-8 hover-lift"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center space-y-3">
              <MessageCircle size={48} className="mx-auto text-gray-600" />
              <p className="text-sm text-gray-400">No chat rooms yet.</p>
              <p className="text-xs text-gray-500">Create one to get started!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
