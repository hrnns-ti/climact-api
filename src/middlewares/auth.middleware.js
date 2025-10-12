import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  // Format header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // ambil token setelah 'Bearer'

  if (!token) return res.status(401).json({ error: 'No token provided.' });

  try {
    // Dekode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Atur user info di request
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}
