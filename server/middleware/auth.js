import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const validateInput = (req, res, next) => {
  const { username, email, password } = req.body;

  if (username && typeof username !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid username' });
  }

  if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  if (password && typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid password' });
  }

  next();
};
