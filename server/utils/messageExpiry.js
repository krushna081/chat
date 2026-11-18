export const EXPIRY_MS = Object.freeze({
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  permanent: null,
});

export const EXPIRY_OPTIONS = Object.freeze(Object.keys(EXPIRY_MS));

export const isValidExpiry = (value) => Object.hasOwn(EXPIRY_MS, value);

export const getExpiryDate = (expiry, now = Date.now()) => {
  if (!isValidExpiry(expiry)) return null;
  const duration = EXPIRY_MS[expiry];
  return duration ? new Date(now + duration) : null;
};
