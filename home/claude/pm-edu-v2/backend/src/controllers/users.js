const { query } = require('../config/database');

// ─── USERS ───────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit)  || 30;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    const role   = req.query.role   || '';

    const params = [];
    const conds  = [];
    if (search) { params.push(`%${search}%`); conds.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
    if (role)   { params.push(role);           conds.push(`role = $${params.length}`); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const countRes = await query(`SELECT COUNT(*) FROM users ${where}`, params);
    const total    = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT id,name,email,role,created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json({ users: rows, total, limit, offset });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.update = async (req, res) => {
  try {
    const { name, role } = req.body;
    const valid = ['student','teacher','admin'];
    if (role && !valid.includes(role)) return res.status(400).json({ error: 'Недопустимая роль' });
    const { rows } = await query(
      'UPDATE users SET name=COALESCE($1,name), role=COALESCE($2,role) WHERE id=$3 RETURNING id,name,email,role',
      [name || null, role || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.remove = async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' });
    await query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// ─── ORDERS ──────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { course_id } = req.body;
    if (!course_id) return res.status(400).json({ error: 'course_id обязателен' });

    const course = await query('SELECT * FROM courses WHERE id=$1 AND is_published=true', [course_id]);
    if (!course.rows.length) return res.status(404).json({ error: 'Курс не найден' });

    // Already enrolled?
    const enrolled = await query(
      'SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, course_id]
    );
    if (enrolled.rows.length) return res.status(409).json({ error: 'Вы уже записаны на этот курс' });

    // Duplicate pending order?
    const pending = await query(
      "SELECT id FROM orders WHERE user_id=$1 AND course_id=$2 AND status='pending'",
      [req.user.id, course_id]
    );
    if (pending.rows.length) return res.json(pending.rows[0]); // return existing

    const { rows } = await query(
      'INSERT INTO orders (user_id,course_id,amount) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, course_id, course.rows[0].price]
    );
    res.status(201).json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const ord = await query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (!ord.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
    if (ord.rows[0].status === 'paid') return res.status(409).json({ error: 'Заказ уже оплачен' });

    await query("UPDATE orders SET status='paid' WHERE id=$1", [id]);
    await query(
      'INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, ord.rows[0].course_id]
    );
    res.json({ ok: true, message: 'Оплата подтверждена. Доступ к курсу открыт.' });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.myOrders = async (req, res) => {
  try {
    // Only show orders for courses the student actually has access to (enrolled)
    const { rows } = await query(`
      SELECT o.*, c.title AS course_title, c.id AS course_id
      FROM orders o
      JOIN courses c ON c.id = o.course_id
      JOIN enrollments e ON e.course_id = o.course_id AND e.user_id = o.user_id
      WHERE o.user_id=$1 ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.allOrders = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT o.*, c.title AS course_title, u.name AS user_name, u.email
      FROM orders o
      JOIN courses c ON c.id=o.course_id
      JOIN users u ON u.id=o.user_id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// ─── STATS ───────────────────────────────────────────
exports.courseStats = async (req, res) => {
  try {
    const { id } = req.params;
    const students  = await query('SELECT COUNT(*) FROM enrollments WHERE course_id=$1', [id]);
    const lessons   = await query('SELECT COUNT(*) FROM lessons WHERE course_id=$1', [id]);
    const testAvg   = await query(`
      SELECT ROUND(AVG(tr.score)) AS avg_score
      FROM test_results tr
      JOIN tests t ON t.id=tr.test_id
      JOIN lessons l ON l.id=t.lesson_id
      WHERE l.course_id=$1
    `, [id]);
    const hwPending = await query(`
      SELECT COUNT(*) FROM homework h
      JOIN lessons l ON l.id=h.lesson_id
      WHERE l.course_id=$1 AND h.status='pending'
    `, [id]);

    // FIX: filter lesson_progress by course
    const progressList = await query(`
      SELECT u.name, u.email,
        COUNT(DISTINCT lp.lesson_id) AS done,
        (SELECT COUNT(*) FROM lessons WHERE course_id=$1) AS total
      FROM enrollments e
      JOIN users u ON u.id=e.user_id
      LEFT JOIN lesson_progress lp ON lp.user_id=u.id
        AND lp.lesson_id IN (SELECT id FROM lessons WHERE course_id=$1)
      WHERE e.course_id=$1
      GROUP BY u.name, u.email
      ORDER BY done DESC
    `, [id]);

    res.json({
      students:   parseInt(students.rows[0].count),
      lessons:    parseInt(lessons.rows[0].count),
      avg_score:  parseInt(testAvg.rows[0].avg_score) || 0,
      hw_pending: parseInt(hwPending.rows[0].count),
      progress:   progressList.rows,
    });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.dashboard = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [users, courses, orders] = await Promise.all([
        query('SELECT COUNT(*) FROM users'),
        query('SELECT COUNT(*) FROM courses WHERE is_published=true'),
        query("SELECT COUNT(*) FROM orders WHERE status='paid'"),
      ]);
      return res.json({
        users:       parseInt(users.rows[0].count),
        courses:     parseInt(courses.rows[0].count),
        paid_orders: parseInt(orders.rows[0].count),
      });
    }
    if (req.user.role === 'teacher') {
      const { rows } = await query(`
        SELECT c.id, c.title, c.is_published,
          COUNT(DISTINCT e.user_id) AS students,
          COUNT(DISTINCT h.id) FILTER (WHERE h.status='pending') AS pending_hw
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id=c.id
        LEFT JOIN lessons l ON l.course_id=c.id
        LEFT JOIN homework h ON h.lesson_id=l.id
        WHERE c.teacher_id=$1 GROUP BY c.id ORDER BY c.created_at DESC
      `, [req.user.id]);
      return res.json(rows);
    }
    // student — progress per course
    const { rows } = await query(`
      SELECT c.id, c.title,
        COUNT(DISTINCT l.id) AS total,
        COUNT(DISTINCT lp.lesson_id) AS done
      FROM enrollments e
      JOIN courses c ON c.id=e.course_id
      LEFT JOIN lessons l ON l.course_id=c.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1
      WHERE e.user_id=$1 GROUP BY c.id ORDER BY e.enrolled_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch(e) { console.error('dashboard ERROR:', e.message); res.status(500).json({ error: e.message }); }
};
