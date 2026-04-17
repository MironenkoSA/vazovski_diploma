const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Требуется авторизация' });

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const { rows } = await query('SELECT id, name, email, role, avatar_url FROM users WHERE id=$1', [decoded.id]);
    if (!rows.length) return res.status(401).json({ error: 'Пользователь не найден' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

const role = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Нет доступа' });
  next();
};

module.exports = { auth, role };
