const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

  try {
    const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email уже занят' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      'INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,avatar_url',
      [name, email, hash, 'student']
    );
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

  try {
    const { rows } = await query('SELECT id,name,email,password,role,avatar_url FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...user } = rows[0];
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.me = async (req, res) => res.json(req.user);
