const express = require('express');
const r = express.Router();
const { auth, role } = require('../middleware/auth');

const authCtrl    = require('../controllers/auth');
const coursesCtrl = require('../controllers/courses');
const lessonsCtrl = require('../controllers/lessons');
const usersCtrl   = require('../controllers/users');
const profileCtrl = require('../controllers/profile');
const simCtrl     = require('../controllers/simulators');

// Optional auth — attaches user if token present, never blocks
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    require('../config/database').query(
      'SELECT id,name,email,role,avatar_url FROM users WHERE id=$1', [decoded.id]
    ).then(({ rows }) => {
      if (rows.length) req.user = rows[0];
      next();
    }).catch(() => next());
  } catch { next(); }
};

// ── Auth ───────────────────────────────────────────────
r.post('/auth/register', authCtrl.register);
r.post('/auth/login',    authCtrl.login);
r.get ('/auth/me',       auth, authCtrl.me);

// ── Courses (public catalog) ───────────────────────────
r.get('/courses',     optionalAuth, coursesCtrl.catalog);
r.get('/courses/:id', optionalAuth, coursesCtrl.getOne);

// ── Student ────────────────────────────────────────────
r.get ('/my/courses',         auth, role('student'), coursesCtrl.myCourses);
r.post('/courses/:id/enroll', auth, role('student'), coursesCtrl.enroll);
r.get ('/my/homework',        auth, role('student'), lessonsCtrl.myHomework);
r.post('/homework',           auth, role('student'), lessonsCtrl.submitHw);

// ── Orders ─────────────────────────────────────────────
r.post('/orders',             auth, role('student'), usersCtrl.createOrder);
r.post('/orders/:id/confirm', auth, role('student'), usersCtrl.confirmOrder);
r.get ('/my/orders',          auth, role('student'), usersCtrl.myOrders);

// ── Lessons ────────────────────────────────────────────
r.get ('/lessons/:id',          auth, lessonsCtrl.getLesson);
r.post('/lessons',              auth, role('teacher','admin'), lessonsCtrl.createLesson);
r.post('/tests/:testId/submit', auth, role('student'), lessonsCtrl.submitTest);

// ── Teacher ────────────────────────────────────────────
r.get('/my/teaching',                auth, role('teacher'), coursesCtrl.teachingCourses);
r.get('/courses/:courseId/homework', auth, role('teacher','admin'), lessonsCtrl.getHwForTeacher);
r.put('/homework/:id/grade',         auth, role('teacher','admin'), lessonsCtrl.gradeHw);
r.get('/courses/:id/students',       auth, role('teacher','admin'), coursesCtrl.students);
r.get('/courses/:id/stats',          auth, role('teacher','admin'), usersCtrl.courseStats);
r.put('/courses/:id/publish',        auth, role('teacher','admin'), coursesCtrl.publish);

// ── Admin ──────────────────────────────────────────────
r.get   ('/admin/users',                    auth, role('admin'), usersCtrl.list);
r.put   ('/admin/users/:id',                auth, role('admin'), usersCtrl.update);
r.delete('/admin/users/:id',                auth, role('admin'), usersCtrl.remove);
r.get   ('/admin/courses',                  auth, role('admin'), coursesCtrl.adminAll);
r.post  ('/admin/courses',                  auth, role('admin'), coursesCtrl.create);
r.put   ('/admin/courses/:id',              auth, role('admin'), coursesCtrl.adminUpdate);
r.post  ('/admin/enroll',                   auth, role('admin'), coursesCtrl.adminEnroll);
r.delete('/admin/enroll/:courseId/:userId', auth, role('admin'), coursesCtrl.adminUnenroll);
r.get   ('/admin/orders',                   auth, role('admin'), usersCtrl.allOrders);

// ── Dashboard ──────────────────────────────────────────
r.get('/dashboard', auth, usersCtrl.dashboard);

// ── Profile ────────────────────────────────────────────
r.get ('/profile',          auth, profileCtrl.get);
r.put ('/profile',          auth, profileCtrl.update);
r.post('/profile/password', auth, profileCtrl.changePassword);

// ── Simulators ─────────────────────────────────────────
r.get ('/simulators',             auth, simCtrl.list);
r.post('/simulators/:id/submit',  auth, simCtrl.submit);

module.exports = r;
