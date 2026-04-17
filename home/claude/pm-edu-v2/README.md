# PMEdu — Образовательная платформа

Дипломный проект: веб-приложение для обучения проектному менеджменту.

**Стек:** React 18 · Node.js/Express · PostgreSQL · JWT · Docker

---

## Запуск

### Docker (1 команда)
```bash
cp backend/.env.example backend/.env
docker-compose up --build
# → http://localhost:3000
```

### Вручную
```bash
# 1. Запустите PostgreSQL, создайте БД pmedu
# 2. Backend
cd backend
cp .env.example .env        # настройте DB_PASSWORD
npm install
node src/config/database.js # создаёт таблицы и тестовые данные
npm run dev                 # :4000

# 3. Frontend
cd frontend
npm install
npm start                   # :3000
```

---

## Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@pmedu.ru | admin123 |
| Преподаватель | teacher@pmedu.ru | teacher123 |
| Студент | student@pmedu.ru | student123 |

*Нажмите на аккаунт на странице входа — поля заполнятся автоматически.*

---

## Возможности

### 🎓 Студент
- Каталог курсов (`/catalog`) — без регистрации
- Запись на бесплатные курсы, покупка платных (stub-оплата)
- Просмотр статей и видеоуроков
- Прохождение тестов с автопроверкой
- Сдача домашних заданий
- История заказов

### 👨‍🏫 Преподаватель
- Список своих курсов с количеством студентов
- Проверка домашних заданий, выставление оценок и комментариев
- Статистика курса: прогресс каждого студента

### ⚙️ Администратор
- Управление пользователями (создание, удаление, смена роли)
- Создание курсов, назначение преподавателей
- Просмотр всех заказов

---

## Структура проекта

```
pmedu/
├── backend/
│   └── src/
│       ├── config/database.js   # схема БД + тестовые данные
│       ├── middleware/auth.js   # JWT + RBAC
│       ├── controllers/         # auth, courses, lessons, users
│       ├── routes/index.js      # все маршруты
│       └── index.js             # Express сервер
└── frontend/
    └── src/
        ├── styles/global.css    # дизайн-система
        ├── components/          # UI.jsx, Layout.jsx
        ├── store/AuthContext.jsx
        ├── utils/api.js         # Axios
        └── pages/
            ├── auth/            # Login, Register
            ├── student/         # Dashboard, Catalog, Course, Lesson
            ├── teacher/         # Homework review, Stats
            └── admin/           # Users, Courses, Orders
```

---

## API (основные эндпоинты)

```
POST /api/auth/register   — регистрация
POST /api/auth/login      — вход
GET  /api/courses         — каталог (публично)
GET  /api/courses/:id     — курс с уроками
GET  /api/lessons/:id     — урок + тест/задание
POST /api/tests/:id/submit — ответы на тест
POST /api/homework        — сдать задание
PUT  /api/homework/:id/grade — оценить задание
POST /api/orders          — создать заказ (покупка)
POST /api/orders/:id/confirm — подтвердить оплату (stub)
```
