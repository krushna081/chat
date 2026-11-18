const roomKeys = new Map();

export const generateEncryptionKey = async () =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

export const encryptMessage = async (message, key) => {
  if (typeof message !== 'string' || !key) {
    throw new Error('A message and encryption key are required');
  }

  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  return {
    iv: bufferToHex(iv),
    encryptedData: bufferToHex(new Uint8Array(encryptedBuffer)),
  };
};

export const decryptMessage = async (encryptedData, iv, key) => {
  if (!encryptedData || !iv || !key) {
    throw new Error('Encrypted message data and key are required');
  }

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBuffer(iv) },
    key,
    hexToBuffer(encryptedData)
  );

  return new TextDecoder().decode(decryptedBuffer);
};

export const exportKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToHex(new Uint8Array(exported));
};

export const importKey = async (hexKey) => {
  if (typeof hexKey !== 'string' || hexKey.length !== 64 || !/^[a-f0-9]+$/i.test(hexKey)) {
    throw new Error('Invalid room key');
  }

  return crypto.subtle.importKey(
    'raw',
    hexToBuffer(hexKey),
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const storeEncryptionKey = (key, roomId) => {
  if (!roomId || typeof key !== 'string' || !/^[a-f0-9]{64}$/i.test(key)) return;
  roomKeys.set(roomId, key);
};

export const retrieveEncryptionKey = (roomId) => roomKeys.get(roomId) || null;

export const getStoredKey = async (roomId) => {
  const hexKey = retrieveEncryptionKey(roomId);
  if (!hexKey) return null;
  return importKey(hexKey);
};

export const clearStoredEncryptionKeys = () => {
  roomKeys.clear();
};

export const bufferToHex = (buffer) =>
  Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export const hexToBuffer = (hexString) => {
  if (
    typeof hexString !== 'string' ||
    hexString.length % 2 !== 0 ||
    !/^[a-f0-9]*$/i.test(hexString)
  ) {
    throw new Error('Invalid hexadecimal data');
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let index = 0; index < hexString.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hexString.slice(index, index + 2), 16);
  }
  return bytes;
};
