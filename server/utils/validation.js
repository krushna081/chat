export const PASSWORD_REQUIREMENTS =
  'Password must be 8–72 characters and include uppercase, lowercase, a number, and a symbol';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,24}$/;
const ROOM_ID_PATTERN = /^[a-f0-9]{16}$/;
const HEX_PATTERN = /^[a-f0-9]+$/;
const IMAGE_DATA_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,([a-zA-Z0-9+/=]+)$/;

export const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const normalizeUsername = (value) => (typeof value === 'string' ? value.trim() : '');

export const isValidEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);

export const isValidUsername = (value) => typeof value === 'string' && USERNAME_PATTERN.test(value);

export const isValidPassword = (value) => {
  if (typeof value !== 'string') return false;
  if (value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) return false;
  return (
    /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value)
  );
};

export const isValidRoomId = (value) => typeof value === 'string' && ROOM_ID_PATTERN.test(value);

export const isValidRoomName = (value) => {
  if (typeof value !== 'string') return false;
  const name = value.trim();
  return name.length >= 1 && name.length <= 80;
};

export const isValidEncryptedPayload = (encryptedMessage, iv) => {
  if (typeof encryptedMessage !== 'string' || typeof iv !== 'string') return false;
  if (iv.length !== 24 || !HEX_PATTERN.test(iv)) return false;
  if (encryptedMessage.length < 2 || encryptedMessage.length > 131_072) return false;
  if (encryptedMessage.length % 2 !== 0) return false;
  return HEX_PATTERN.test(encryptedMessage);
};

export const isValidImage = (value, maxBytes = 512 * 1024) => {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  if (value.startsWith('https://')) return value.length <= 2048;
  const match = IMAGE_DATA_PATTERN.exec(value);
  if (!match) return false;
  const encoded = match[2];
  if (encoded.length % 4 !== 0) return false;
  const decoded = Buffer.from(encoded, 'base64');
  return decoded.length > 0 && decoded.length <= maxBytes;
};

export const sanitizeText = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};
