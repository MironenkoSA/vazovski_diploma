const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// GET /profile
exports.get = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// PUT /profile  — name, avatar_url
exports.update = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Имя не может быть пустым' });

    const { rows } = await query(
      'UPDATE users SET name=$1, avatar_url=$2 WHERE id=$3 RETURNING id,name,email,role,avatar_url',
      [name.trim(), avatar_url || null, req.user.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /profile/password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Укажите текущий и новый пароль' });
    if (new_password.length < 6)
      return res.status(400).json({ error: 'Новый пароль минимум 6 символов' });

    const { rows } = await query('SELECT password FROM users WHERE id=$1', [req.user.id]);
    const ok = await bcrypt.compare(current_password, rows[0].password);
    if (!ok) return res.status(400).json({ error: 'Неверный текущий пароль' });

    const hash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};
