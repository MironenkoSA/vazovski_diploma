const { query } = require('../config/database');

// Simulators are static definitions tied to course titles
// In a real system these would be stored in DB; here we define them in code
// and check enrollment dynamically.

const SIMULATORS = [
  {
    id: 'excel-formulas',
    title: 'Тренажёр формул Excel',
    description: 'Практика написания формул для обработки проектных данных',
    icon: '📊',
    course_keyword: 'Основы проектного', // must be enrolled in course matching this
    type: 'excel',
  },
  {
    id: 'gantt-chart',
    title: 'Диаграмма Ганта',
    description: 'Составление диаграммы Ганта для учебного проекта',
    icon: '📅',
    course_keyword: 'Основы проектного',
    type: 'gantt',
  },
  {
    id: 'presentation-review',
    title: 'Тренажёр насмотренности',
    description: 'Найдите типовые ошибки в проектных презентациях',
    icon: '🔍',
    course_keyword: 'Лидерство',
    type: 'presentation',
  },
];

// GET /simulators — return simulators the user has access to
exports.list = async (req, res) => {
  try {
    // Admin and teacher see all simulators unlocked
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      return res.json(SIMULATORS.map(s => ({ ...s, unlocked: true, required_course: s.course_keyword })));
    }

    // Student: check enrollment
    const enrolled = await query(
      `SELECT c.title FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1`,
      [req.user.id]
    );
    const enrolledTitles = enrolled.rows.map(r => r.title);

    const available = SIMULATORS.map(s => ({
      ...s,
      unlocked: enrolledTitles.some(t => t.includes(s.course_keyword)),
      required_course: s.course_keyword,
    }));

    res.json(available);
  } catch(e) { res.status(500).json({ error: 'Ошибка сервера' }); }
};

// POST /simulators/:id/submit — save result (optional, for tracking)
exports.submit = async (req, res) => {
  // Just acknowledge — results are checked client-side for these sim types
  res.json({ ok: true, feedback: req.body.feedback || '' });
};
