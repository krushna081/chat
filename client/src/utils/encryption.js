// AES-256-GCM Encryption Utility
export const generateEncryptionKey = async () => {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (message, key) => {
  const encoder = new TextEncoder();
  const messageBuffer = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    messageBuffer
  );

  return {
    iv: bufferToHex(iv),
    encryptedData: bufferToHex(new Uint8Array(encryptedBuffer)),
  };
};

export const decryptMessage = async (encryptedData, iv, key) => {
  const ivBuffer = hexToBuffer(iv);
  const dataBuffer = hexToBuffer(encryptedData);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    dataBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

export const exportKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToHex(new Uint8Array(exported));
};

export const importKey = async (hexKey) => {
  const keyBuffer = hexToBuffer(hexKey);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

const bufferToHex = (buffer) => {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const hexToBuffer = (hexString) => {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
};

// Store encryption key securely in localStorage. Support per-room keys.
export const storeEncryptionKey = (key, roomId = null) => {
  const name = roomId ? `encryptionKey:${roomId}` : 'encryptionKey';
  localStorage.setItem(name, key);
};

export const retrieveEncryptionKey = (roomId = null) => {
  const name = roomId ? `encryptionKey:${roomId}` : 'encryptionKey';
  return localStorage.getItem(name);
};

export const generateAndStoreKey = async (roomId = null) => {
  const key = await generateEncryptionKey();
  const exportedKey = await exportKey(key);
  storeEncryptionKey(exportedKey, roomId);
  return key;
};

// Get stored key for a specific room if provided, otherwise global key
export const getStoredKey = async (roomId = null) => {
  const hexKey = retrieveEncryptionKey(roomId);
  if (!hexKey) {
    return await generateAndStoreKey(roomId);
  }
  return await importKey(hexKey);
};
