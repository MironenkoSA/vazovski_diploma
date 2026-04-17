require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pmedu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const query = (sql, params) => pool.query(sql, params);

if (require.main === module) {
  (async () => {
    try {
      await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

      await query(`CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
        avatar_url TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW())`)
;

      await query(`CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) UNIQUE NOT NULL, description TEXT, category VARCHAR(100),
        teacher_id UUID REFERENCES users(id), price NUMERIC(10,2) DEFAULT 0,
        is_published BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);

      await query(`CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, course_id))`);

      await query(`CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL, content TEXT,
        type VARCHAR(20) DEFAULT 'article' CHECK (type IN ('article','video','test','homework')),
        video_url TEXT, position INT DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`);

      await query(`CREATE TABLE IF NOT EXISTS tests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, pass_score INT DEFAULT 60)`);

      await query(`CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        text TEXT NOT NULL, options JSONB NOT NULL, correct_index INT NOT NULL, position INT DEFAULT 0)`);

      await query(`CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        score INT NOT NULL, passed BOOLEAN NOT NULL, created_at TIMESTAMP DEFAULT NOW())`);

      await query(`CREATE TABLE IF NOT EXISTS homework (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        answer TEXT NOT NULL, grade INT, feedback TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','graded')),
        submitted_at TIMESTAMP DEFAULT NOW())`);

      await query(`CREATE TABLE IF NOT EXISTS lesson_progress (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        done BOOLEAN DEFAULT true, completed_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, lesson_id))`);

      await query(`CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
        created_at TIMESTAMP DEFAULT NOW())`);

      // ── Upgrade columns (safe on both fresh and existing DB) ──
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`);
      await query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_settings JSONB DEFAULT NULL`);
      await query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS article_structure JSONB DEFAULT NULL`);
      await query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS max_chars INT DEFAULT NULL`);
      await query(`ALTER TABLE homework ADD COLUMN IF NOT EXISTS file_urls JSONB DEFAULT '[]'`);
      await query(`ALTER TABLE homework ADD COLUMN IF NOT EXISTS needs_revision BOOLEAN DEFAULT false`);
      await query(`ALTER TABLE homework ADD COLUMN IF NOT EXISTS revision_count INT DEFAULT 0`);
      await query(`ALTER TABLE homework ADD COLUMN IF NOT EXISTS lesson_max_chars INT DEFAULT NULL`);
      await query(`ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS watched_pct INT DEFAULT 0`);

      // Guard
      const existing = await query(`SELECT COUNT(*) FROM users`);
      if (parseInt(existing.rows[0].count) > 0) {
        console.log('✅ Already seeded, skipping'); process.exit(0);
      }

      const bcrypt = require('bcryptjs');
      const h = (pw) => bcrypt.hash(pw, 10);

      // Admin
      const aRes = await query(
        `INSERT INTO users (name,email,password,role) VALUES ('Администратор','admin@pmedu.ru',$1,'admin') RETURNING id`,
        [await h('admin123')]);
      const adminId = aRes.rows[0].id;

      // 5 Teachers
      const teacherList = [
        ['Иван Петров',      'teacher@pmedu.ru'],
        ['Анна Соколова',    'sokolova@pmedu.ru'],
        ['Дмитрий Волков',   'volkov@pmedu.ru'],
        ['Елена Морозова',   'morozova@pmedu.ru'],
        ['Сергей Новиков',   'novikov@pmedu.ru'],
      ];
      const tIds = [];
      for (const [name, email] of teacherList) {
        const r = await query(
          `INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,'teacher') RETURNING id`,
          [name, email, await h('teacher123')]);
        tIds.push(r.rows[0].id);
      }

      // 30 Students
      const studentList = [
        ['Мария Иванова',     'student@pmedu.ru'],
        ['Алексей Смирнов',   'smirnov@pmedu.ru'],
        ['Ольга Козлова',     'kozlova@pmedu.ru'],
        ['Никита Попов',      'popov@pmedu.ru'],
        ['Юлия Лебедева',     'lebedeva@pmedu.ru'],
        ['Андрей Кузнецов',   'kuznetsov@pmedu.ru'],
        ['Екатерина Зайцева', 'zaitseva@pmedu.ru'],
        ['Михаил Соловьёв',   'solovev@pmedu.ru'],
        ['Татьяна Васильева', 'vasilieva@pmedu.ru'],
        ['Роман Павлов',      'pavlov@pmedu.ru'],
        ['Ирина Семёнова',    'semenova@pmedu.ru'],
        ['Виктор Голубев',    'golubev@pmedu.ru'],
        ['Наталья Виноградова','vinogradova@pmedu.ru'],
        ['Денис Богданов',    'bogdanov@pmedu.ru'],
        ['Светлана Орлова',   'orlova@pmedu.ru'],
        ['Кирилл Фёдоров',    'fedorov@pmedu.ru'],
        ['Анастасия Михайлова','mikhailova@pmedu.ru'],
        ['Артём Алексеев',    'alekseev@pmedu.ru'],
        ['Вера Макарова',     'makarova@pmedu.ru'],
        ['Павел Андреев',     'andreev@pmedu.ru'],
        ['Дарья Степанова',   'stepanova@pmedu.ru'],
        ['Илья Захаров',      'zakharov@pmedu.ru'],
        ['Валерия Яковлева',  'yakovleva@pmedu.ru'],
        ['Евгений Борисов',   'borisov@pmedu.ru'],
        ['Полина Кирилова',   'kirilova@pmedu.ru'],
        ['Максим Тихонов',    'tikhonov@pmedu.ru'],
        ['Алина Громова',     'gromova@pmedu.ru'],
        ['Игорь Сидоров',     'sidorov@pmedu.ru'],
        ['Ксения Белова',     'belova@pmedu.ru'],
        ['Фёдор Комаров',     'komarov@pmedu.ru'],
      ];
      const sIds = [];
      for (const [name, email] of studentList) {
        const r = await query(
          `INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,'student') RETURNING id`,
          [name, email, await h('student123')]);
        sIds.push(r.rows[0].id);
      }

      // ══════════════════════════════════════════
      // 10 COURSES
      // ══════════════════════════════════════════
      const courseDefs = [
        { title:'Основы проектного менеджмента',   desc:'Введение в управление проектами. Жизненный цикл, роли, методологии.',                  cat:'Менеджмент', ti:0, price:0    },
        { title:'Agile и Scrum на практике',        desc:'Гибкие методологии: спринты, ретроспективы, роли в Scrum-команде.',                   cat:'Agile',       ti:1, price:3990 },
        { title:'Управление рисками проекта',       desc:'Идентификация, анализ и реагирование на риски. Матрица рисков, стратегии.',            cat:'Управление',  ti:2, price:4990 },
        { title:'Бюджетирование и финансы',         desc:'Составление бюджета, контроль расходов, earned value management.',                     cat:'Финансы',     ti:3, price:5990 },
        { title:'Лидерство и управление командой',  desc:'Мотивация, разрешение конфликтов, стили лидерства в проектной среде.',                 cat:'Менеджмент',  ti:4, price:4490 },
        { title:'MS Project и инструменты ПМ',      desc:'Практическое освоение MS Project, Jira, Trello и других инструментов.',                cat:'Инструменты', ti:0, price:2990 },
        { title:'Коммуникации в проекте',           desc:'Управление стейкхолдерами, отчётность, презентации, переговоры.',                      cat:'Менеджмент',  ti:1, price:3490 },
        { title:'Управление качеством',             desc:'Стандарты качества, аудит, метрики, инструменты контроля качества в проектах.',        cat:'Управление',  ti:2, price:4990 },
        { title:'Инициация и планирование проекта', desc:'Устав проекта, WBS, сетевые диаграммы, критический путь, базовый план.',              cat:'Менеджмент',  ti:3, price:3990 },
        { title:'Управление изменениями',           desc:'Процессы изменений, оценка влияния, контроль изменений в проектах.',                   cat:'Управление',  ti:4, price:4490 },
      ];
      const cIds = [];
      for (const c of courseDefs) {
        const r = await query(
          `INSERT INTO courses (title,description,category,teacher_id,price,is_published) VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
          [c.title, c.desc, c.cat, tIds[c.ti], c.price]);
        cIds.push(r.rows[0].id);
      }

      // ── Video URLs ──
      const VID_YT    = 'https://www.youtube.com/watch?v=9HUhqlPxzAc';
      const VID_RT    = 'https://rutube.ru/video/3d88566caff7e5d4f5a5eadf5652abf6/';
      const VID_GD    = 'https://drive.google.com/file/d/1vxzimnfOFzxnvgCxKA-ljWzUyo7PG0e_/view?usp=sharing';

      // ════════════════════════════════════════
      // LESSONS — Course 1: Основы ПМ (15 уроков)
      // ════════════════════════════════════════
      const c1l = [];
      const ins = async (cid, title, type, pos, content, video_url=null, max_chars=null) => {
        const r = await query(
          `INSERT INTO lessons (course_id,title,content,type,video_url,position,max_chars)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [cid, title, content||'', type, video_url, pos, max_chars]);
        return r.rows[0].id;
      };

      // Course 1
      c1l[0]  = await ins(cIds[0],'Что такое проект?','article',1,'<h2>Определение проекта</h2><p>Проект — временное предприятие для создания уникального продукта или результата. В отличие от операционной деятельности, проект имеет <strong>чёткое начало и конец</strong>.</p><h3>Ключевые характеристики</h3><ul><li>Уникальность результата</li><li>Ограниченные сроки</li><li>Ограниченные ресурсы</li><li>Определённая цель</li></ul>');
      c1l[1]  = await ins(cIds[0],'Жизненный цикл проекта','video',2,'<p>Видеолекция о фазах проекта.</p>',VID_YT);
      c1l[2]  = await ins(cIds[0],'Роли в проекте','article',3,'<h2>Ключевые роли</h2><p>В любом проекте есть несколько ключевых ролей: <strong>спонсор</strong> — обеспечивает ресурсы и политическую поддержку; <strong>руководитель проекта</strong> — отвечает за результат; <strong>команда проекта</strong> — выполняет работы; <strong>заказчик</strong> — принимает результат.</p>');
      c1l[3]  = await ins(cIds[0],'Устав проекта','article',4,'<h2>Устав проекта (Project Charter)</h2><p>Устав — документ, официально авторизующий проект. Содержит: цели и задачи, ключевые требования, основные риски, сводное расписание, бюджет, список стейкхолдеров.</p>');
      c1l[4]  = await ins(cIds[0],'Тест: основы ПМ','test',5,'Проверка базовых знаний');
      c1l[5]  = await ins(cIds[0],'Планирование проекта','article',6,'<h2>Процессы планирования</h2><p>Планирование включает: определение содержания, создание WBS, разработку расписания, планирование бюджета, планирование рисков и коммуникаций.</p><h3>WBS — иерархическая структура работ</h3><p>WBS разбивает весь объём работ на управляемые компоненты. Нижний уровень — пакеты работ (work packages).</p>');
      c1l[6]  = await ins(cIds[0],'Видео: планирование','video',7,'<p>Видео о планировании проекта.</p>',VID_RT);
      c1l[7]  = await ins(cIds[0],'Управление сроками','article',8,'<h2>Инструменты управления сроками</h2><p>Диаграмма Ганта — визуальное представление расписания. Метод критического пути (CPM) определяет минимальное время выполнения проекта. Float/Slack — резерв времени для некритических задач.</p>');
      c1l[8]  = await ins(cIds[0],'Мониторинг и контроль','article',9,'<h2>Контроль исполнения</h2><p>Earned Value Management (EVM) — методология для интегрированной оценки исполнения проекта по стоимости и срокам. Ключевые метрики: PV, EV, AC, SPI, CPI.</p>');
      c1l[9]  = await ins(cIds[0],'Видео: завершение проекта','video',10,'<p>Завершение и извлечённые уроки.</p>',VID_GD);
      c1l[10] = await ins(cIds[0],'Управление заинтересованными сторонами','article',11,'<h2>Стейкхолдеры проекта</h2><p>Стейкхолдеры — все, кто влияет на проект или на кого влияет проект. Матрица "власть/интерес" помогает приоритизировать управление ожиданиями.</p>');
      c1l[11] = await ins(cIds[0],'Тест: планирование и контроль','test',12,'Проверка знаний по планированию');
      c1l[12] = await ins(cIds[0],'Закрытие проекта','article',13,'<h2>Процессы закрытия</h2><p>Закрытие включает: получение формального приёмки, архивирование документов, анализ уроков проекта (lessons learned), освобождение ресурсов.</p>');
      c1l[13] = await ins(cIds[0],'Практика: план небольшого проекта','article',14,'<h2>Задание для самостоятельной работы</h2><p>Выберите любой учебный проект и составьте для него базовый план: цели, WBS, расписание на 4 недели, бюджет.</p>');
      c1l[14] = await ins(cIds[0],'Домашнее задание: описание проекта','homework',15,'<p><strong>Задание:</strong> Опишите любой проект из вашей жизни. Укажите цель, сроки, ресурсы и результат. Объём: 150–300 слов.</p>',null,500);

      // Test 1 questions
      const t1 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,60) RETURNING id`, [c1l[4]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что отличает проект от операционной деятельности?','["Наличие бюджета","Уникальность и ограниченность во времени","Количество сотрудников","Наличие клиента"]',1,1)`, [t1.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Какая фаза НЕ входит в жизненный цикл проекта?','["Инициация","Планирование","Серийное производство","Завершение"]',2,2)`, [t1.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Документ, фиксирующий цели и рамки проекта:','["Бизнес-план","Устав проекта","Техническое задание","Протокол совещания"]',1,3)`, [t1.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'WBS — это:','["Метод оценки рисков","Иерархическая структура работ","График проекта","Реестр стейкхолдеров"]',1,4)`, [t1.rows[0].id]);

      const t1b = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,70) RETURNING id`, [c1l[11]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что такое критический путь?','["Наиболее рискованная задача","Самая длинная последовательность задач без резерва","Задача с наибольшим бюджетом","Первая задача проекта"]',1,1)`, [t1b.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'CPI > 1 означает:','["Проект отстаёт","Проект опережает","Стоимость ниже плана","Стоимость выше плана"]',2,2)`, [t1b.rows[0].id]);

      // ════════════════════════════════════════
      // LESSONS — Course 2: Agile и Scrum (15 уроков)
      // ════════════════════════════════════════
      const c2l = [];
      c2l[0]  = await ins(cIds[1],'Манифест Agile','article',1,'<h2>12 принципов Agile</h2><p>Agile Manifesto был создан в 2001 году 17 разработчиками. Ключевые ценности: <strong>люди и взаимодействие</strong> важнее процессов; <strong>работающий продукт</strong> важнее документации; <strong>сотрудничество с клиентом</strong> важнее контракта; <strong>готовность к изменениям</strong> важнее следования плану.</p>');
      c2l[1]  = await ins(cIds[1],'Видео: Введение в Agile','video',2,'<p>Обзор гибких методологий.</p>',VID_YT);
      c2l[2]  = await ins(cIds[1],'Scrum Framework','article',3,'<h2>Роли в Scrum</h2><p><strong>Product Owner</strong> — отвечает за ценность продукта, управляет бэклогом. <strong>Scrum Master</strong> — фасилитатор, устраняет препятствия. <strong>Dev Team</strong> — самоорганизующаяся команда 3–9 человек.</p>');
      c2l[3]  = await ins(cIds[1],'Спринт и артефакты','article',4,'<h2>Спринт</h2><p>Спринт — фиксированный цикл 1–4 недели. Артефакты: <strong>Product Backlog</strong> — список всех требований; <strong>Sprint Backlog</strong> — задачи текущего спринта; <strong>Increment</strong> — работающий продукт в конце спринта.</p>');
      c2l[4]  = await ins(cIds[1],'Scrum-церемонии','article',5,'<h2>Встречи в Scrum</h2><p><strong>Sprint Planning</strong> — планирование спринта. <strong>Daily Scrum</strong> — 15-минутный стендап. <strong>Sprint Review</strong> — демонстрация результата. <strong>Retrospective</strong> — анализ процесса команды.</p>');
      c2l[5]  = await ins(cIds[1],'Тест: Agile и Scrum','test',6,'Проверка знаний');
      c2l[6]  = await ins(cIds[1],'Видео: Scrum на практике','video',7,'<p>Демонстрация работы Scrum-команды.</p>',VID_RT);
      c2l[7]  = await ins(cIds[1],'Kanban','article',8,'<h2>Метод Kanban</h2><p>Kanban — визуальная система управления потоком работ. Принципы: визуализация работы, ограничение WIP (Work In Progress), управление потоком, постепенные улучшения.</p>');
      c2l[8]  = await ins(cIds[1],'Оценка задач','article',9,'<h2>Story Points и Planning Poker</h2><p>Story Points — относительная оценка сложности задач. Planning Poker — техника совместной оценки командой. Velocity — средняя скорость команды в story points за спринт.</p>');
      c2l[9]  = await ins(cIds[1],'Видео: ретроспектива','video',10,'<p>Техники проведения ретроспектив.</p>',VID_GD);
      c2l[10] = await ins(cIds[1],'Масштабирование Agile','article',11,'<h2>SAFe и LeSS</h2><p>Scaled Agile Framework (SAFe) — фреймворк для масштабирования Agile в крупных организациях. Large-Scale Scrum (LeSS) — упрощённый подход к масштабированию.</p>');
      c2l[11] = await ins(cIds[1],'Метрики Agile-команды','article',12,'<h2>Измерение эффективности</h2><p>Velocity, Burndown chart, Cumulative Flow Diagram, Lead Time, Cycle Time — ключевые метрики для оценки работы Agile-команды.</p>');
      c2l[12] = await ins(cIds[1],'Тест: продвинутый Agile','test',13,'Проверка продвинутых знаний');
      c2l[13] = await ins(cIds[1],'Практика: ретроспектива','article',14,'<h2>Форматы ретроспективы</h2><p>Start/Stop/Continue, 4Ls (Liked/Learned/Lacked/Longed for), Mad/Sad/Glad — популярные форматы для ретроспективных встреч.</p>');
      c2l[14] = await ins(cIds[1],'Домашнее задание: спринт-план','homework',15,'<p><strong>Задание:</strong> Составьте Sprint Backlog для гипотетического проекта. Опишите 5–7 задач с оценками в Story Points. Объём: 200–350 слов.</p>',null,600);

      const t2 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,70) RETURNING id`, [c2l[5]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Сколько принципов в Agile Manifesto?','["6","10","12","15"]',2,1)`, [t2.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Кто такой Scrum Master?','["Менеджер проекта","Фасилитатор Scrum-процессов","Главный разработчик","Заказчик"]',1,2)`, [t2.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что такое Definition of Done?','["Список задач спринта","Критерии завершённости задачи","Цель продукта","Роль в команде"]',1,3)`, [t2.rows[0].id]);

      const t2b = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,70) RETURNING id`, [c2l[12]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что ограничивает Kanban в отличие от Scrum?','["Количество участников","WIP (Work in Progress)","Длительность спринта","Роли в команде"]',1,1)`, [t2b.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Velocity — это:','["Скорость одного разработчика","Среднее количество story points за спринт","Время выполнения задачи","Количество багов"]',1,2)`, [t2b.rows[0].id]);

      // ════════════════════════════════════════
      // LESSONS — Course 3: Управление рисками (15 уроков)
      // ════════════════════════════════════════
      const c3l = [];
      c3l[0]  = await ins(cIds[2],'Введение в управление рисками','article',1,'<h2>Что такое риск?</h2><p>Риск — неопределённое событие, которое может положительно или отрицательно повлиять на цели проекта. Риски бывают угрозами (отрицательные) и возможностями (положительные).</p>');
      c3l[1]  = await ins(cIds[2],'Видео: идентификация рисков','video',2,'<p>Методы выявления рисков.</p>',VID_YT);
      c3l[2]  = await ins(cIds[2],'Матрица рисков','article',3,'<h2>Матрица вероятность/воздействие</h2><p>Матрица помогает приоритизировать риски. Ось X — вероятность (низкая/средняя/высокая). Ось Y — воздействие. Высокий приоритет — верхний правый угол матрицы.</p>');
      c3l[3]  = await ins(cIds[2],'Количественный анализ рисков','article',4,'<h2>Методы количественного анализа</h2><p>Метод Монте-Карло — компьютерное моделирование. Анализ дерева решений — для дискретных рисков. EMV (Expected Monetary Value) — ожидаемая денежная стоимость риска.</p>');
      c3l[4]  = await ins(cIds[2],'Стратегии реагирования','article',5,'<h2>Стратегии для угроз</h2><p><strong>Уклонение</strong> — изменить план чтобы устранить риск. <strong>Передача</strong> — переложить ответственность (страхование). <strong>Снижение</strong> — уменьшить вероятность или воздействие. <strong>Принятие</strong> — пассивное или активное.</p>');
      c3l[5]  = await ins(cIds[2],'Тест: основы управления рисками','test',6,'Проверка знаний');
      c3l[6]  = await ins(cIds[2],'Видео: реестр рисков','video',7,'<p>Как вести реестр рисков на практике.</p>',VID_RT);
      c3l[7]  = await ins(cIds[2],'Реестр рисков','article',8,'<h2>Структура реестра рисков</h2><p>Реестр содержит: ID риска, описание, категорию, вероятность, воздействие, приоритет, стратегию реагирования, ответственного, статус.</p>');
      c3l[8]  = await ins(cIds[2],'Триггеры и владельцы рисков','article',9,'<h2>Мониторинг рисков</h2><p>Триггер — событие, сигнализирующее о наступлении риска. Владелец риска — ответственный за мониторинг и реагирование. Резервы: управленческий резерв и резерв на непредвиденные.</p>');
      c3l[9]  = await ins(cIds[2],'Видео: анализ кейсов','video',10,'<p>Разбор реальных рисков в проектах.</p>',VID_GD);
      c3l[10] = await ins(cIds[2],'Риски в Agile-проектах','article',11,'<h2>Управление рисками в гибких методологиях</h2><p>В Agile риски управляются через короткие итерации, постоянную обратную связь и прозрачность. Риски выносятся в бэклог как отдельные истории.</p>');
      c3l[11] = await ins(cIds[2],'Тест: продвинутый анализ рисков','test',12,'Продвинутый тест');
      c3l[12] = await ins(cIds[2],'Практика: анализ кейса','article',13,'<h2>Разбор кейса</h2><p>Проект строительства офиса. Задача: идентифицировать риски, составить матрицу и предложить стратегии реагирования.</p>');
      c3l[13] = await ins(cIds[2],'Контрольный мониторинг рисков','article',14,'<h2>Процесс мониторинга</h2><p>Регулярный обзор реестра, актуализация вероятностей и воздействий, отслеживание триггеров, внедрение планов реагирования.</p>');
      c3l[14] = await ins(cIds[2],'Домашнее задание: реестр рисков','homework',15,'<p><strong>Задание:</strong> Составьте реестр рисков для учебного проекта. Опишите не менее 5 рисков с вероятностью, воздействием и стратегией реагирования.</p>',null,800);

      const t3 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,60) RETURNING id`, [c3l[5]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что такое риск-аппетит?','["Страх перед рисками","Готовность организации принимать риски","Размер резервного фонда","Количество рисков в реестре"]',1,1)`, [t3.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Стратегия "передача риска" означает:','["Игнорирование риска","Страхование или аутсорсинг","Изменение плана","Уменьшение вероятности"]',1,2)`, [t3.rows[0].id]);

      // ════════════════════════════════════════
      // LESSONS — Courses 4–10 (по 15 уроков каждый, компактно)
      // ════════════════════════════════════════
      const mkCourse = async (cid, lessons) => {
        const ids = [];
        for (const [i, l] of lessons.entries()) {
          ids.push(await ins(cid, l.t, l.type||'article', i+1, l.c||'<p>Материал урока.</p>', l.v||null, l.mc||null));
        }
        return ids;
      };

      // Course 4: Бюджетирование
      const c4l = await mkCourse(cIds[3], [
        {t:'Введение в бюджетирование проекта',c:'<h2>Базовые понятия</h2><p>Бюджет проекта — оценка всех затрат. Включает прямые и косвенные расходы, резервы на непредвиденные расходы и управленческий резерв.</p>'},
        {t:'Видео: составление бюджета',type:'video',v:VID_YT,c:'<p>Как составить бюджет проекта.</p>'},
        {t:'Методы оценки стоимости',c:'<h2>Методы оценки</h2><p>Аналоговая оценка — на основе исторических данных. Параметрическая — по математической модели. Оценка снизу-вверх — детальная по каждой работе.</p>'},
        {t:'Базовый план по стоимости',c:'<h2>Cost Baseline</h2><p>Базовый план — утверждённый бюджет с разбивкой по времени. Используется для измерения и мониторинга исполнения стоимости.</p>'},
        {t:'Earned Value Management',c:'<h2>EVM метрики</h2><p>PV (Planned Value), EV (Earned Value), AC (Actual Cost). Отклонения: SV = EV-PV, CV = EV-AC. Индексы: SPI = EV/PV, CPI = EV/AC.</p>'},
        {t:'Тест: основы бюджетирования',type:'test',c:'Проверка знаний'},
        {t:'Видео: EVM на практике',type:'video',v:VID_RT,c:'<p>Применение Earned Value Management.</p>'},
        {t:'Прогнозирование стоимости',c:'<h2>Прогнозы EAC</h2><p>EAC (Estimate at Completion) — прогноз итоговой стоимости. Формулы: EAC = BAC/CPI или EAC = AC + (BAC-EV)/CPI.</p>'},
        {t:'Управление резервами',c:'<h2>Виды резервов</h2><p>Contingency Reserve — резерв на известные риски (в базовом плане). Management Reserve — резерв на неизвестные риски (вне базового плана).</p>'},
        {t:'Видео: контроль расходов',type:'video',v:VID_GD,c:'<p>Практика контроля расходов.</p>'},
        {t:'Отчётность по стоимости',c:'<h2>Отчёты о стоимости</h2><p>Регулярная отчётность включает: фактические затраты, прогноз до завершения, отклонения, тренды. Периодичность: еженедельно или по вехам.</p>'},
        {t:'Финансовые риски проекта',c:'<h2>Управление финансовыми рисками</h2><p>Курсовые риски, инфляция, изменение цен на ресурсы. Стратегии хеджирования и страхования финансовых рисков.</p>'},
        {t:'Тест: EVM и прогнозирование',type:'test',c:'Продвинутый тест'},
        {t:'Практика: расчёт бюджета',c:'<h2>Кейс: IT-проект</h2><p>Рассчитайте бюджет IT-проекта с командой 5 человек на 6 месяцев. Дано: ставки, объёмы работ, стоимость лицензий и оборудования.</p>'},
        {t:'Домашнее задание: бюджет проекта',type:'homework',mc:700,c:'<p><strong>Задание:</strong> Составьте бюджет учебного проекта. Укажите все статьи расходов, резервы и итоговую сумму. Объём: 200–400 слов.</p>'},
      ]);
      const t4 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,65) RETURNING id`, [c4l[5]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что такое CPI?','["Cost Performance Index — индекс исполнения стоимости","Critical Path Index","Contract Price Index","Cost Planning Index"]',0,1)`, [t4.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'CPI = 0.8 означает:','["Проект в рамках бюджета","На каждый потраченный рубль получено 80 копеек ценности","Проект опережает план","Бюджет превышен на 20%"]',1,2)`, [t4.rows[0].id]);

      // Course 5: Лидерство (15 уроков)
      const c5l = await mkCourse(cIds[4], [
        {t:'Что такое лидерство в проекте',c:'<h2>Лидерство vs Менеджмент</h2><p>Менеджер управляет системами и процессами. Лидер вдохновляет и ведёт людей. Эффективный руководитель проекта совмещает оба подхода.</p>'},
        {t:'Видео: стили лидерства',type:'video',v:VID_YT,c:'<p>Обзор основных стилей лидерства.</p>'},
        {t:'Теории мотивации',c:'<h2>Ключевые теории</h2><p>Маслоу: иерархия потребностей. Герцберг: гигиенические и мотивационные факторы. МакГрегор: теории X и Y. Современные подходы к мотивации проектных команд.</p>'},
        {t:'Формирование команды','c':'<h2>Стадии Такмана</h2><p>Forming (знакомство) → Storming (конфликты) → Norming (нормализация) → Performing (высокая эффективность) → Adjourning (расставание).</p>'},
        {t:'Управление конфликтами',c:'<h2>Стратегии разрешения конфликтов</h2><p>Конкуренция, сотрудничество, компромисс, уклонение, приспособление. В проектах предпочтительны сотрудничество и компромисс.</p>'},
        {t:'Тест: лидерство и мотивация',type:'test',c:'Проверка знаний'},
        {t:'Видео: управление командой',type:'video',v:VID_RT,c:'<p>Практические техники управления командой.</p>'},
        {t:'Эмоциональный интеллект',c:'<h2>EQ руководителя</h2><p>Самосознание, саморегуляция, мотивация, эмпатия, социальные навыки — пять компонентов эмоционального интеллекта Гоулмана.</p>'},
        {t:'Делегирование и контроль',c:'<h2>Эффективное делегирование</h2><p>Принципы делегирования: чёткая постановка задачи, достаточность ресурсов, согласование сроков, контрольные точки, обратная связь.</p>'},
        {t:'Видео: обратная связь',type:'video',v:VID_GD,c:'<p>Техники конструктивной обратной связи.</p>'},
        {t:'Работа с удалёнными командами',c:'<h2>Особенности дистанционного управления</h2><p>Культурные различия, временные зоны, инструменты коммуникации, построение доверия в распределённых командах.</p>'},
        {t:'Принятие решений',c:'<h2>Модели принятия решений</h2><p>Рациональная модель, ограниченная рациональность, интуитивные решения. Инструменты: матрица решений, дерево решений, мозговой штурм.</p>'},
        {t:'Тест: продвинутое лидерство',type:'test',c:'Продвинутый тест'},
        {t:'Практика: анализ кейса',c:'<h2>Кейс: конфликт в команде</h2><p>Разберите ситуацию: два разработчика конфликтуют из-за подхода к архитектуре. Срок проекта — через 3 недели. Как руководитель, опишите ваши действия.</p>'},
        {t:'Домашнее задание: план развития команды',type:'homework',mc:600,c:'<p><strong>Задание:</strong> Опишите план развития вашей (реальной или гипотетической) команды на 3 месяца. Укажите цели, методы мотивации и метрики успеха.</p>'},
      ]);
      const t5 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,65) RETURNING id`, [c5l[5]]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'На стадии Storming команда:','["Только познакомилась","Конфликтует, выясняет роли","Работает слаженно","Расстаётся"]',1,1)`, [t5.rows[0].id]);

      // Courses 6-10: по 15 уроков, упрощённая структура
      const courseConfigs = [
        { ci:5, hw:'Домашнее задание: обзор инструментов',          hwdesc:'Сравните MS Project и Jira по 5 критериям. Укажите плюсы и минусы каждого инструмента. Объём: 200–350 слов.',                                               mc:600 },
        { ci:6, hw:'Домашнее задание: план коммуникаций',           hwdesc:'Составьте матрицу коммуникаций для проекта с 8 стейкхолдерами. Укажите формат, частоту и ответственного.',                                                   mc:500 },
        { ci:7, hw:'Домашнее задание: план качества',               hwdesc:'Разработайте план управления качеством для IT-проекта. Укажите метрики, методы контроля и критерии приёмки.',                                                mc:700 },
        { ci:8, hw:'Домашнее задание: устав проекта',               hwdesc:'Напишите устав проекта для открытия кофейни. Включите цели, ограничения, допущения и ключевых стейкхолдеров.',                                              mc:800 },
        { ci:9, hw:'Домашнее задание: план управления изменениями', hwdesc:'Опишите процесс управления изменениями для вашего проекта. Укажите шаги оценки, одобрения и внедрения изменений.',                                          mc:600 },
      ];
      for (const courseConfig of courseConfigs) {
        const ci = courseConfig.ci;
        const videos = [VID_YT, VID_RT, VID_GD];
        const lessonTitles = [
          'Введение в тему', 'Видео: обзор', 'Ключевые концепции',
          'Методы и инструменты', 'Практическое применение', 'Тест: базовые знания',
          'Видео: кейс', 'Углублённый анализ', 'Лучшие практики',
          'Видео: продвинутые техники', 'Типичные ошибки', 'Международные стандарты',
          'Тест: продвинутый уровень', 'Практика: кейс',
          courseConfig.hw,
        ];
        const cLessons = [];
        for (const [j, title] of lessonTitles.entries()) {
          const pos = j + 1;
          const isVideo = title.startsWith('Видео:');
          const isTest  = title.startsWith('Тест:');
          const isHW    = j === 14;
          const ltype   = isVideo?'video':isTest?'test':isHW?'homework':'article';
          const vid     = isVideo ? videos[Math.floor(j/4) % 3] : null;
          const mc      = isHW ? courseConfig.mc : null;
          const cnt     = isHW
            ? `<p><strong>Задание:</strong> ${courseConfig.hwdesc}</p>`
            : isTest ? 'Проверка знаний'
            : isVideo ? `<p>Видеоматериал по теме урока.</p>`
            : `<p>Материал урока по теме курса.</p>`;
          const lid = await ins(cIds[ci], title, ltype, pos, cnt, vid, mc);
          cLessons.push(lid);
          if (isTest) {
            const tr = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,65) RETURNING id`, [lid]);
            await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Вопрос 1 по теме курса:','["Ответ A","Ответ B (верный)","Ответ C","Ответ D"]',1,1)`, [tr.rows[0].id]);
            await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Вопрос 2 по теме курса:','["Ответ A","Ответ B","Ответ C (верный)","Ответ D"]',2,2)`, [tr.rows[0].id]);
          }
        }
      }

      // ════════════════════════════════════════
      // ENROLLMENTS
      // ════════════════════════════════════════
      for (const sid of sIds)                { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[0]]); }
      for (const sid of sIds.slice(0,15))    { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[1]]); }
      for (const sid of sIds.slice(5,15))    { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[2]]); }
      for (const sid of sIds.slice(0,8))     { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[3]]); }
      for (const sid of sIds.slice(10,18))   { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[4]]); }
      for (const sid of sIds.slice(20,26))   { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[5]]); }
      for (const sid of sIds.slice(0,12))    { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[6]]); }
      for (const sid of sIds.slice(8,16))    { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[7]]); }
      for (const sid of sIds.slice(15,22))   { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[8]]); }
      for (const sid of sIds.slice(22,29))   { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[9]]); }

      // ════════════════════════════════════════
      // PROGRESS for main student (sIds[0])
      // ════════════════════════════════════════
      for (const lid of [c1l[0], c1l[1], c1l[2], c1l[3]]) {
        await query(`INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [sIds[0], lid]);
      }

      // ════════════════════════════════════════
      // HOMEWORK — diverse statuses
      // ════════════════════════════════════════
      const hwLesson1 = c1l[14]; // Course 1 ДЗ
      const hwLesson2 = c2l[14]; // Course 2 ДЗ
      const hwLesson3 = c3l[14]; // Course 3 ДЗ

      // Главный студент (sIds[0]): одно ДЗ требует доработку
      await query(
        `INSERT INTO homework (lesson_id,user_id,answer,status,grade,feedback,needs_revision)
         VALUES ($1,$2,$3,'pending',NULL,'',true)`,
        [hwLesson1, sIds[0],
         'Мой проект — организация корпоратива на 50 человек. Цель: провести мероприятие. Сроки: 3 недели. Ресурсы: 150 000 руб. Результат: мероприятие прошло успешно.']
      );
      // Главный студент: одно ДЗ оценено
      await query(
        `INSERT INTO homework (lesson_id,user_id,answer,status,grade,feedback,needs_revision)
         VALUES ($1,$2,$3,'graded',85,'Хорошая работа! Структура описания правильная. Рекомендую более детально расписать ресурсы.',false)`,
        [hwLesson2, sIds[0],
         'Sprint Backlog для разработки мобильного приложения: 1) Авторизация — 5 SP, 2) Главный экран — 3 SP, 3) Профиль пользователя — 3 SP, 4) Push-уведомления — 8 SP, 5) Интеграция с API — 13 SP. Итого: 32 SP за спринт.']
      );

      // Другие студенты — ожидают оценки
      const pendingHW = [
        { sid: sIds[1], ans: 'Проект ремонта квартиры. Цель: обновить интерьер. Сроки: 2 месяца. Ресурсы: 400 000 руб. Результат: завершён с опозданием на 1 неделю из-за задержки поставок материалов.' },
        { sid: sIds[2], ans: 'Организация студенческой конференции. 200 участников, 10 секций. Ресурсы: грант 80 000 руб. Все задачи выполнены в срок, участники дали высокую оценку.' },
        { sid: sIds[3], ans: 'Проект внедрения CRM в малом бизнесе. Цель: автоматизировать продажи. Сроки: 4 месяца. Бюджет: 200 000 руб. Результат: внедрено, конверсия выросла на 15%.' },
        { sid: sIds[4], ans: 'Запуск интернет-магазина. Цель: выйти на онлайн-продажи. Сроки: 3 месяца. Ресурсы: 120 000 руб. Результат: сайт запущен, первые продажи получены на 2-й месяц.' },
      ];
      for (const { sid, ans } of pendingHW) {
        await query(
          `INSERT INTO homework (lesson_id,user_id,answer,status) VALUES ($1,$2,$3,'pending')`,
          [hwLesson1, sid, ans]
        );
      }

      // Оценённые задания других студентов
      const gradedHW = [
        { sid: sIds[5], ans: 'Проект создания корпоративного сайта. Цель: представить компанию онлайн. Сроки: 6 недель. Бюджет: 80 000 руб. Выполнен в срок и в рамках бюджета.', grade: 90, fb: 'Отличная работа! Все элементы описаны чётко и структурировано.' },
        { sid: sIds[6], ans: 'Разработка системы учёта склада. Цель: автоматизировать инвентаризацию. Сроки: 3 месяца. Ресурсы: команда 4 человека. Результат: система внедрена, ошибки снижены на 30%.', grade: 78, fb: 'Хорошо! Но стоит указать конкретные числовые ресурсы.' },
        { sid: sIds[7], ans: 'Организация переезда офиса. Цель: переместить 50 рабочих мест без остановки работы. Сроки: 2 выходных дня. Бюджет: 300 000 руб. Всё выполнено в срок.', grade: 95, fb: 'Превосходно! Образцовое описание проекта.' },
      ];
      for (const { sid, ans, grade, fb } of gradedHW) {
        await query(
          `INSERT INTO homework (lesson_id,user_id,answer,status,grade,feedback,needs_revision)
           VALUES ($1,$2,$3,'graded',$4,$5,false)`,
          [hwLesson1, sid, ans, grade, fb]
        );
        await query(
          `INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [sid, hwLesson1]
        );
      }

      // Задание на доработку для другого студента
      await query(
        `INSERT INTO homework (lesson_id,user_id,answer,status,needs_revision,feedback)
         VALUES ($1,$2,$3,'pending',true,'Недостаточно деталей. Пожалуйста, добавьте конкретные числовые показатели: бюджет, сроки в днях, количество участников команды.')`,
        [hwLesson1, sIds[9], 'Мой проект — это проект по работе. Мы сделали что-то новое для компании. Всё получилось хорошо.']
      );

      // ДЗ по курсу 3 (риски) — несколько статусов
      await query(
        `INSERT INTO homework (lesson_id,user_id,answer,status) VALUES ($1,$2,$3,'pending')`,
        [hwLesson3, sIds[0], 'Реестр рисков проекта внедрения ERP:\n1. Превышение бюджета (вер. Высокая, возд. Критическое) — резервный фонд 20%\n2. Задержка поставок ПО (вер. Средняя, возд. Высокое) — альтернативный поставщик\n3. Сопротивление персонала (вер. Высокая, возд. Среднее) — программа обучения\n4. Технические сбои (вер. Низкая, возд. Критическое) — резервная система\n5. Уход ключевого специалиста (вер. Средняя, возд. Высокое) — документация знаний']
      );

      // ════════════════════════════════════════
      // ORDERS
      // ════════════════════════════════════════
      const orderData = [
        [sIds[0],  cIds[1], 3990, 'paid'],  [sIds[1],  cIds[1], 3990, 'paid'],
        [sIds[2],  cIds[1], 3990, 'paid'],  [sIds[3],  cIds[1], 3990, 'paid'],
        [sIds[4],  cIds[1], 3990, 'paid'],  [sIds[5],  cIds[2], 4990, 'paid'],
        [sIds[6],  cIds[2], 4990, 'paid'],  [sIds[7],  cIds[2], 4990, 'paid'],
        [sIds[8],  cIds[2], 4990, 'paid'],  [sIds[9],  cIds[2], 4990, 'paid'],
        [sIds[0],  cIds[3], 5990, 'paid'],  [sIds[1],  cIds[3], 5990, 'paid'],
        [sIds[2],  cIds[3], 5990, 'paid'],  [sIds[3],  cIds[4], 4490, 'paid'],
        [sIds[10], cIds[4], 4490, 'paid'],  [sIds[11], cIds[4], 4490, 'paid'],
        [sIds[20], cIds[5], 2990, 'paid'],  [sIds[21], cIds[5], 2990, 'paid'],
        [sIds[0],  cIds[6], 3490, 'paid'],  [sIds[1],  cIds[7], 4990, 'paid'],
        [sIds[2],  cIds[8], 3990, 'paid'],  [sIds[3],  cIds[9], 4490, 'paid'],
        [sIds[15], cIds[1], 3990, 'pending'], [sIds[16], cIds[2], 4990, 'pending'],
        [sIds[17], cIds[3], 5990, 'pending'], [sIds[25], cIds[4], 4490, 'pending'],
        [sIds[26], cIds[6], 3490, 'pending'], [sIds[27], cIds[1], 3990, 'cancelled'],
      ];
      for (const [uid, cid, amount, status] of orderData) {
        await query(`INSERT INTO orders (user_id,course_id,amount,status) VALUES ($1,$2,$3,$4)`, [uid, cid, amount, status]);
      }

      const total = 1 + 5 + 30;
      console.log('✅ Database initialized');
      console.log('─────────────────────────────────');
      console.log('👑 admin@pmedu.ru    / admin123');
      console.log('👨‍🏫 teacher@pmedu.ru  / teacher123  (+4 преподавателя)');
      console.log('🎓 student@pmedu.ru  / student123  (+29 студентов)');
      console.log(`📚 Курсов: 10 | 👥 ${total} пользователей | 💳 ${orderData.length} заказов`);
      process.exit(0);
    } catch (e) {
      console.error('❌', e.message);
      process.exit(1);
    }
  })();
}

module.exports = { query, pool };
