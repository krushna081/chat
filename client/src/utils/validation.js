export const PASSWORD_REQUIREMENTS =
  'Password must be 8–72 characters and include uppercase, lowercase, a number, and a symbol';

export const isStrongPassword = (value) => {
  if (typeof value !== 'string') return false;
  if (value.length < 8 || new TextEncoder().encode(value).length > 72) return false;
  return (
    /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value)
  );
};

export const isValidEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const isValidUsername = (value) =>
  typeof value === 'string' && /^[a-zA-Z0-9_.-]{3,24}$/.test(value.trim());
