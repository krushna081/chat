import { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';

export default function RoomPasswordModal({ roomName, loading, onClose, onSubmit }) {
  const [password, setPassword] = useState('');
  const inputRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        cardRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]'
        ) || []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password && !loading) onSubmit(password);
  };

  return (
    <div className="modal-overlay" role="presentation">
      <form
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-password-title"
        aria-describedby="room-password-description"
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close password dialog"
        >
          <X size={18} />
        </button>
        <div className="modal-icon" aria-hidden="true">
          <Lock size={22} />
        </div>
        <h2 id="room-password-title">Password required</h2>
        <p id="room-password-description">Enter the password for “{roomName}” to join this room.</p>
        <label htmlFor="room-password-modal">Room password</label>
        <input
          id="room-password-modal"
          ref={inputRef}
          type="password"
          className="input-primary"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!password || loading}>
            {loading ? 'Joining…' : 'Join room'}
          </button>
        </div>
      </form>
    </div>
  );
}
