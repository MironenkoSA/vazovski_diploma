const { query } = require('../config/database');

// GET /courses — публичный каталог
exports.catalog = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, u.name AS teacher_name,
        COUNT(DISTINCT l.id) AS lessons_count,
        COUNT(DISTINCT e.user_id) AS students_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.is_published = true
      GROUP BY c.id, u.name ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /my/courses — курсы студента
exports.myCourses = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    
    const enrolled = await query(
      `SELECT c.id, c.title, c.description, c.category, 
              c.price, c.is_published, c.teacher_id, c.created_at,
              u.name AS teacher_name
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE e.user_id = $1
       ORDER BY MAX(e.enrolled_at) DESC`,
      [req.user.id]
    );
    
    if (!enrolled.rows.length) return res.json([]);
    
    const result = [];
    for (const c of enrolled.rows) {
      let lessons_count = 0, done_count = 0;
      try {
        const lc = await query('SELECT COUNT(*) FROM lessons WHERE course_id=$1', [c.id]);
        lessons_count = parseInt(lc.rows[0].count) || 0;
      } catch(e2) { console.error('lesson count error:', e2.message); }
      try {
        const dc = await query(
          `SELECT COUNT(*) FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           WHERE l.course_id=$1 AND lp.user_id=$2`,
          [c.id, req.user.id]
        );
        done_count = parseInt(dc.rows[0].count) || 0;
      } catch(e3) { console.error('done count error:', e3.message); }
      result.push({ ...c, lessons_count, done_count });
    }
    
    res.json(result);
  } catch(e) {
    console.error('myCourses FATAL:', e.message, e.stack);
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n')[0] });
  }
};


// GET /my/teaching — курсы преподавателя
exports.teachingCourses = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, COUNT(DISTINCT e.user_id) AS students_count,
        COUNT(DISTINCT l.id) AS lessons_count,
        COUNT(DISTINCT h.id) FILTER (WHERE h.status='pending') AS pending_hw
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN homework h ON h.lesson_id = l.id
      WHERE c.teacher_id = $1
      GROUP BY c.id ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /courses/:id — доступен публично, но авторизованным даёт больше данных
exports.getOne = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, u.name AS teacher_name
      FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Курс не найден' });

    const lessons = await query(
      'SELECT id,title,type,position FROM lessons WHERE course_id=$1 ORDER BY position',
      [req.params.id]
    );

    let enrolled = false, progress = [];
    if (req.user?.role === 'student') {
      const e = await query(
        'SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2',
        [req.user.id, req.params.id]
      );
      enrolled = e.rows.length > 0;
      if (enrolled) {
        // FIX: filter progress by this course only
        const p = await query(
          `SELECT lp.lesson_id FROM lesson_progress lp
           JOIN lessons l ON l.id = lp.lesson_id
           WHERE lp.user_id=$1 AND l.course_id=$2`,
          [req.user.id, req.params.id]
        );
        progress = p.rows.map(r => r.lesson_id);
      }
    } else if (req.user?.role === 'teacher' || req.user?.role === 'admin') {
      enrolled = true;
    }

    res.json({ ...rows[0], lessons: lessons.rows, enrolled, progress });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /admin/courses
exports.create = async (req, res) => {
  try {
    const { title, description, category, teacher_id, price } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const { rows } = await query(
      'INSERT INTO courses (title,description,category,teacher_id,price,is_published) VALUES ($1,$2,$3,$4,$5,false) RETURNING *',
      [title, description || null, category || null, teacher_id || null, Number(price) || 0]
    );
    res.status(201).json(rows[0]);
  } catch(e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Курс с таким названием уже существует' });
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// PUT /courses/:id/publish
exports.publish = async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE courses SET is_published=true WHERE id=$1 RETURNING *', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Курс не найден' });
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /courses/:id/enroll
exports.enroll = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await query('SELECT * FROM courses WHERE id=$1 AND is_published=true', [id]);
    if (!course.rows.length) return res.status(404).json({ error: 'Курс не найден' });
    const c = course.rows[0];

    // Check already enrolled
    const already = await query(
      'SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, id]
    );
    if (already.rows.length) return res.status(409).json({ error: 'Вы уже записаны на этот курс' });

    if (Number(c.price) > 0) {
      const ord = await query(
        "SELECT id FROM orders WHERE user_id=$1 AND course_id=$2 AND status='paid'",
        [req.user.id, id]
      );
      if (!ord.rows.length) return res.status(402).json({ error: 'Требуется оплата' });
    }

    await query('INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2)', [req.user.id, id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /courses/:id/students
exports.students = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT u.id, u.name, u.email, e.enrolled_at,
        COUNT(DISTINCT lp.lesson_id) AS done_lessons,
        (SELECT COUNT(*) FROM lessons WHERE course_id=$1) AS total_lessons
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      LEFT JOIN lesson_progress lp ON lp.user_id = u.id
        AND lp.lesson_id IN (SELECT id FROM lessons WHERE course_id=$1)
      WHERE e.course_id = $1
      GROUP BY u.id, u.name, u.email, e.enrolled_at
    `, [req.params.id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /admin/courses
exports.adminAll = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, u.name AS teacher_name, COUNT(DISTINCT e.user_id) AS students_count
      FROM courses c LEFT JOIN users u ON c.teacher_id=u.id
      LEFT JOIN enrollments e ON e.course_id=c.id
      GROUP BY c.id, u.name ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// PUT /admin/courses/:id — update teacher, title etc (admin)
exports.adminUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, title, description, price, is_published } = req.body;
    const { rows } = await query(
      `UPDATE courses SET
        teacher_id = COALESCE($1, teacher_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        is_published = COALESCE($5, is_published)
       WHERE id=$6 RETURNING *`,
      [teacher_id||null, title||null, description||null,
       price!==undefined?Number(price):null,
       is_published!==undefined?is_published:null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Курс не найден' });
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /admin/enroll — admin enrolls student in course
exports.adminEnroll = async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    if (!user_id || !course_id) return res.status(400).json({ error: 'user_id и course_id обязательны' });

    // Check user is student
    const user = await query('SELECT id, role FROM users WHERE id=$1', [user_id]);
    if (!user.rows.length) return res.status(404).json({ error: 'Пользователь не найден' });

    await query(
      'INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [user_id, course_id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// DELETE /admin/enroll/:courseId/:userId — admin removes student
exports.adminUnenroll = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    await query('DELETE FROM enrollments WHERE course_id=$1 AND user_id=$2', [courseId, userId]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /my/auto-enroll — enroll student in all free published courses
exports.autoEnrollFree = async (req, res) => {
  try {
    const freeCourses = await query(
      `SELECT id FROM courses WHERE price=0 AND is_published=true`
    );
    let enrolled = 0;
    for (const c of freeCourses.rows) {
      const r = await query(
        'INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id',
        [req.user.id, c.id]
      );
      if (r.rows.length) enrolled++;
    }
    res.json({ enrolled });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /debug/student - temporary debug endpoint
exports.debugStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const [enrollments, tables, lpCols] = await Promise.all([
      query('SELECT e.*, c.title FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1', [userId]),
      query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`),
      query(`SELECT column_name FROM information_schema.columns WHERE table_name='lesson_progress' ORDER BY column_name`),
    ]);
    res.json({
      userId,
      enrollments: enrollments.rows,
      tables: tables.rows.map(r=>r.table_name),
      lesson_progress_columns: lpCols.rows.map(r=>r.column_name),
    });
  } catch(e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};
