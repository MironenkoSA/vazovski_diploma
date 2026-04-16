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

      // Add avatar_url if upgrading existing DB
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`);

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

      // 6 Courses
      const courseDefs = [
        { title:'Основы проектного менеджмента', desc:'Введение в управление проектами. Жизненный цикл, роли, методологии.', cat:'Менеджмент', ti:0, price:0 },
        { title:'Agile и Scrum на практике', desc:'Гибкие методологии: спринты, ретроспективы, роли в Scrum-команде.', cat:'Agile', ti:1, price:3990 },
        { title:'Управление рисками проекта', desc:'Идентификация, анализ и реагирование на риски. Матрица рисков, стратегии реагирования.', cat:'Управление', ti:2, price:4990 },
        { title:'Бюджетирование и финансы', desc:'Составление бюджета, контроль расходов, earned value management.', cat:'Финансы', ti:3, price:5990 },
        { title:'Лидерство и управление командой', desc:'Мотивация, разрешение конфликтов, стили лидерства в проектной среде.', cat:'Менеджмент', ti:4, price:4490 },
        { title:'MS Project и инструменты ПМ', desc:'Практическое освоение MS Project, Jira, Trello и других инструментов.', cat:'Инструменты', ti:0, price:2990 },
      ];
      const cIds = [];
      for (const c of courseDefs) {
        const r = await query(
          `INSERT INTO courses (title,description,category,teacher_id,price,is_published) VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
          [c.title, c.desc, c.cat, tIds[c.ti], c.price]);
        cIds.push(r.rows[0].id);
      }

      // Lessons — Course 1
      const l1 = await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Что такое проект?','<h2>Определение проекта</h2><p>Проект — временное предприятие для создания уникального продукта или результата. В отличие от операционной деятельности, проект имеет <strong>чёткое начало и конец</strong>.</p><h3>Ключевые характеристики</h3><ul><li>Уникальность результата</li><li>Ограниченные сроки</li><li>Ограниченные ресурсы</li><li>Определённая цель</li></ul>','article',1) RETURNING id`, [cIds[0]]);
      const l2 = await query(`INSERT INTO lessons (course_id,title,content,type,video_url,position) VALUES ($1,'Жизненный цикл проекта','<p>Видеолекция о фазах проекта.</p>','video','https://www.youtube.com/embed/tGCaoRcykMg',2) RETURNING id`, [cIds[0]]);
      const l3 = await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Тест: основы ПМ','Проверка базовых знаний','test',3) RETURNING id`, [cIds[0]]);
      const l4 = await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Домашнее задание','<p><strong>Задание:</strong> Опишите любой проект из вашей жизни. Укажите цель, сроки, ресурсы и результат. Объём: 150–300 слов.</p>','homework',4) RETURNING id`, [cIds[0]]);

      const t1 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,60) RETURNING id`, [l3.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Что отличает проект от операционной деятельности?','["Наличие бюджета","Уникальность и ограниченность во времени","Количество сотрудников","Наличие клиента"]',1,1)`, [t1.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Какая из фаз НЕ входит в жизненный цикл проекта?','["Инициация","Планирование","Серийное производство","Завершение"]',2,2)`, [t1.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Документ, фиксирующий цели и рамки проекта:','["Бизнес-план","Устав проекта","Техническое задание","Протокол совещания"]',1,3)`, [t1.rows[0].id]);

      // Lessons — Course 2
      await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Принципы Agile Manifesto','<h2>12 принципов Agile</h2><p>Agile Manifesto был создан в 2001 году 17 разработчиками. Ключевые ценности: люди и взаимодействие, работающий продукт, сотрудничество с клиентом, готовность к изменениям.</p>','article',1)`, [cIds[1]]);
      await query(`INSERT INTO lessons (course_id,title,content,type,video_url,position) VALUES ($1,'Scrum Framework','<p>Видеолекция о фреймворке Scrum.</p>','video','https://www.youtube.com/embed/9TycLR0TqFA',2)`, [cIds[1]]);
      const l2t = await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Тест: Agile и Scrum','Проверка знаний','test',3) RETURNING id`, [cIds[1]]);
      const t2 = await query(`INSERT INTO tests (lesson_id,pass_score) VALUES ($1,70) RETURNING id`, [l2t.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Сколько принципов в Agile Manifesto?','["6","10","12","15"]',2,1)`, [t2.rows[0].id]);
      await query(`INSERT INTO questions (test_id,text,options,correct_index,position) VALUES ($1,'Кто такой Scrum Master?','["Менеджер проекта","Фасилитатор Scrum-процессов","Главный разработчик","Заказчик"]',1,2)`, [t2.rows[0].id]);

      // Lessons — Course 3
      await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Введение в управление рисками','<h2>Что такое риск?</h2><p>Риск — неопределённое событие, которое может положительно или отрицательно повлиять на цели проекта.</p>','article',1)`, [cIds[2]]);
      await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Матрица рисков','<p>Матрица вероятности и воздействия помогает приоритизировать риски и выбрать стратегию реагирования.</p>','article',2)`, [cIds[2]]);
      await query(`INSERT INTO lessons (course_id,title,content,type,position) VALUES ($1,'Домашнее задание: реестр рисков','<p><strong>Задание:</strong> Составьте реестр рисков для учебного проекта. Опишите не менее 5 рисков с вероятностью, воздействием и стратегией реагирования.</p>','homework',3)`, [cIds[2]]);

      // Enrollments
      for (const sid of sIds)                { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[0]]); }
      for (const sid of sIds.slice(0,15))    { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[1]]); }
      for (const sid of sIds.slice(5,15))    { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[2]]); }
      for (const sid of sIds.slice(0,8))     { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[3]]); }
      for (const sid of sIds.slice(10,16))   { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[4]]); }
      for (const sid of sIds.slice(20,25))   { await query(`INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[sid, cIds[5]]); }

      // Progress for main student
      await query(`INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2)`, [sIds[0], l1.rows[0].id]);
      await query(`INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2)`, [sIds[0], l2.rows[0].id]);

      // Orders
      const orderData = [
        [sIds[0],  cIds[1], 3990, 'paid'],
        [sIds[1],  cIds[1], 3990, 'paid'],
        [sIds[2],  cIds[1], 3990, 'paid'],
        [sIds[3],  cIds[1], 3990, 'paid'],
        [sIds[4],  cIds[1], 3990, 'paid'],
        [sIds[5],  cIds[2], 4990, 'paid'],
        [sIds[6],  cIds[2], 4990, 'paid'],
        [sIds[7],  cIds[2], 4990, 'paid'],
        [sIds[8],  cIds[2], 4990, 'paid'],
        [sIds[9],  cIds[2], 4990, 'paid'],
        [sIds[0],  cIds[3], 5990, 'paid'],
        [sIds[1],  cIds[3], 5990, 'paid'],
        [sIds[2],  cIds[3], 5990, 'paid'],
        [sIds[3],  cIds[4], 4490, 'paid'],
        [sIds[10], cIds[4], 4490, 'paid'],
        [sIds[11], cIds[4], 4490, 'paid'],
        [sIds[20], cIds[5], 2990, 'paid'],
        [sIds[21], cIds[5], 2990, 'paid'],
        [sIds[22], cIds[5], 2990, 'paid'],
        [sIds[15], cIds[1], 3990, 'pending'],
        [sIds[16], cIds[2], 4990, 'pending'],
        [sIds[17], cIds[3], 5990, 'pending'],
        [sIds[25], cIds[4], 4490, 'pending'],
        [sIds[26], cIds[5], 2990, 'pending'],
        [sIds[27], cIds[1], 3990, 'cancelled'],
      ];
      for (const [uid, cid, amount, status] of orderData) {
        await query(`INSERT INTO orders (user_id,course_id,amount,status) VALUES ($1,$2,$3,$4)`, [uid, cid, amount, status]);
      }

      // Some homework
      const hwId = l4.rows[0].id;
      await query(`INSERT INTO homework (lesson_id,user_id,answer) VALUES ($1,$2,$3)`, [hwId, sIds[1], 'Мой проект — организация корпоратива. Цель: мероприятие на 50 человек. Сроки: 3 недели. Ресурсы: 150 000 руб. Результат: задачи выполнены в срок.']);
      await query(`INSERT INTO homework (lesson_id,user_id,answer) VALUES ($1,$2,$3)`, [hwId, sIds[2], 'Проект ремонта квартиры. Цель: обновить интерьер. Сроки: 2 месяца. Ресурсы: 400 000 руб. Результат: завершён с опозданием на 1 неделю.']);
      await query(`INSERT INTO homework (lesson_id,user_id,answer) VALUES ($1,$2,$3)`, [hwId, sIds[3], 'Организация студенческой конференции. Цель: 200 участников, 10 секций. Ресурсы: грант 80 000 руб. Результат: успешно.']);

      const total = 1 + 5 + 30;
      console.log('✅ Database initialized');
      console.log('─────────────────────────────────');
      console.log('👑 admin@pmedu.ru    / admin123');
      console.log('👨‍🏫 teacher@pmedu.ru  / teacher123  (+4 преподавателя)');
      console.log('🎓 student@pmedu.ru  / student123  (+29 студентов)');
      console.log(`📚 Курсов: 6 | 👥 ${total} пользователей | 💳 ${orderData.length} заказов`);
      process.exit(0);
    } catch (e) {
      console.error('❌', e.message);
      process.exit(1);
    }
  })();
}

module.exports = { query, pool };
