const { query } = require('../config/database');

// GET /lessons/:id
exports.getLesson = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Урок не найден' });
    const lesson = rows[0];

    let extra = {};

    if (lesson.type === 'test') {
      const t = await query('SELECT * FROM tests WHERE lesson_id=$1', [lesson.id]);
      if (t.rows.length) {
        const qs = await query(
          'SELECT id,text,options,position FROM questions WHERE test_id=$1 ORDER BY position',
          [t.rows[0].id]
        );
        extra.test = { ...t.rows[0], questions: qs.rows };
        if (req.user?.role === 'student') {
          const prev = await query(
            'SELECT * FROM test_results WHERE user_id=$1 AND test_id=$2 ORDER BY created_at DESC LIMIT 1',
            [req.user.id, t.rows[0].id]
          );
          extra.myResult = prev.rows[0] || null;
        }
      }
    }

    if (lesson.type === 'homework' && req.user?.role === 'student') {
      const hw = await query(
        'SELECT * FROM homework WHERE lesson_id=$1 AND user_id=$2 ORDER BY submitted_at DESC LIMIT 1',
        [lesson.id, req.user.id]
      );
      extra.myHomework = hw.rows[0] || null;
    }

    // Progress is marked explicitly via POST /lessons/:id/complete endpoint

    res.json({ ...lesson, ...extra });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /lessons/:id/complete  — student marks lesson as done manually
exports.completeLesson = async (req, res) => {
  try {
    const { rows } = await query('SELECT id,type FROM lessons WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Урок не найден' });
    if (!['article','video'].includes(rows[0].type))
      return res.status(400).json({ error: 'Только статьи и видео' });
    await query(
      'INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// PUT /lessons/:id — update lesson (teacher/admin)
exports.updateLesson = async (req, res) => {
  try {
    const { title, content, video_url, video_settings, article_structure } = req.body;
    const { rows } = await query(
      `UPDATE lessons SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        video_url = COALESCE($3, video_url),
        video_settings = COALESCE($4, video_settings),
        article_structure = COALESCE($5, article_structure)
       WHERE id=$6 RETURNING *`,
      [title||null, content||null, video_url||null,
       video_settings ? JSON.stringify(video_settings) : null,
       article_structure ? JSON.stringify(article_structure) : null,
       req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Урок не найден' });
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

exports.createLesson = async (req, res) => {
  try {
    const { course_id, title, content, type, video_url, position } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id и title обязательны' });
    const { rows } = await query(
      'INSERT INTO lessons (course_id,title,content,type,video_url,position) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [course_id, title, content || '', type || 'article', video_url || null, position || 0]
    );
    res.status(201).json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /tests/:testId/submit
exports.submitTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Ответы обязательны' });
    }

    const test = await query('SELECT * FROM tests WHERE id=$1', [testId]);
    if (!test.rows.length) return res.status(404).json({ error: 'Тест не найден' });

    const qs = await query('SELECT * FROM questions WHERE test_id=$1 ORDER BY position', [testId]);
    if (!qs.rows.length) return res.status(400).json({ error: 'В тесте нет вопросов' });

    let correct = 0;
    qs.rows.forEach(q => {
      if (String(answers[q.id]) === String(q.correct_index)) correct++;
    });
    const score = Math.round((correct / qs.rows.length) * 100);
    const passed = score >= test.rows[0].pass_score;

    const result = await query(
      'INSERT INTO test_results (user_id,test_id,score,passed) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, testId, score, passed]
    );

    // Mark lesson as done if passed
    if (passed) {
      const lessonRes = await query(
        'SELECT id FROM lessons WHERE id=(SELECT lesson_id FROM tests WHERE id=$1)', [testId]
      );
      if (lessonRes.rows.length) {
        await query(
          'INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [req.user.id, lessonRes.rows[0].id]
        );
      }
    }

    res.json({ ...result.rows[0], total: qs.rows.length, correct });
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /homework
exports.submitHw = async (req, res) => {
  try {
    const { lesson_id, answer } = req.body;
    if (!lesson_id) return res.status(400).json({ error: 'lesson_id обязателен' });
    if (!answer?.trim()) return res.status(400).json({ error: 'Ответ не может быть пустым' });

    // FIX: prevent duplicate submission — only one pending allowed
    const existing = await query(
      "SELECT id FROM homework WHERE lesson_id=$1 AND user_id=$2 AND status='pending'",
      [lesson_id, req.user.id]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Задание уже отправлено и ожидает проверки' });
    }

    const { rows } = await query(
      'INSERT INTO homework (lesson_id,user_id,answer) VALUES ($1,$2,$3) RETURNING *',
      [lesson_id, req.user.id, answer.trim()]
    );
    res.status(201).json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /courses/:courseId/homework
exports.getHwForTeacher = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rows } = await query(`
      SELECT h.*, u.name AS student_name, l.title AS lesson_title
      FROM homework h
      JOIN users u ON u.id = h.user_id
      JOIN lessons l ON l.id = h.lesson_id
      WHERE l.course_id = $1
      ORDER BY h.status ASC, h.submitted_at DESC
    `, [courseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// PUT /homework/:id/grade
exports.gradeHw = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback, needs_revision } = req.body;

    if (grade === undefined || grade === null || grade === '') {
      return res.status(400).json({ error: 'Оценка обязательна' });
    }
    const gradeNum = Number(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      return res.status(400).json({ error: 'Оценка должна быть числом от 0 до 100' });
    }

    const newStatus = needs_revision ? 'pending' : 'graded';
    const { rows } = await query(
      `UPDATE homework SET grade=$1, feedback=$2, status=$3, needs_revision=$4
       WHERE id=$5 RETURNING *`,
      [gradeNum, feedback?.trim() || '', newStatus, !!needs_revision, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Задание не найдено' });

    // Mark done only if not sending back for revision
    if (!needs_revision) {
      await query(
        'INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [rows[0].user_id, rows[0].lesson_id]
      );
    }

    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// PUT /homework/:id/resubmit — student resubmits after revision request
exports.resubmitHw = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, file_urls } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Ответ не может быть пустым' });

    // Verify it belongs to this user and needs revision
    const hw = await query('SELECT * FROM homework WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (!hw.rows.length) return res.status(404).json({ error: 'Задание не найдено' });
    if (!hw.rows[0].needs_revision) return res.status(400).json({ error: 'Задание не требует доработки' });

    const { rows } = await query(
      `UPDATE homework SET answer=$1, file_urls=$2, status='pending',
        needs_revision=false, revision_count=revision_count+1,
        grade=NULL, feedback=NULL, submitted_at=NOW()
       WHERE id=$3 RETURNING *`,
      [answer.trim(), JSON.stringify(file_urls || []), id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// GET /my/homework
exports.myHomework = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT h.*, l.title AS lesson_title, c.title AS course_title, c.id AS course_id
      FROM homework h
      JOIN lessons l ON l.id = h.lesson_id
      JOIN courses c ON c.id = l.course_id
      WHERE h.user_id = $1 ORDER BY h.submitted_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};
