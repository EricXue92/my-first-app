# Tasks

A full-stack Todo app with JWT multi-user authentication, Google/GitHub OAuth, CRUD operations, priority levels, and due date management.

**Stack:** React (Vite + TypeScript + Zustand) · FastAPI · SQLite

---

## Features

- **Authentication** — Register with email verification, login, password reset, Google OAuth, GitHub OAuth
- **Todo Management** — Create, edit, delete, toggle completion
- **Priority** — High / Medium / Low with color coding
- **Due Dates** — Date & time picker with 15-minute slots
- **Filtering** — By status (all / in-progress / completed) and priority
- **Multi-user** — Each user only sees their own todos

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

uvicorn main:app --reload
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

Create `backend/.env`:

```env
# JWT
JWT_SECRET_KEY=your-secret-key

# Email (for verification codes & password reset)
MAIL_USERNAME=you@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=you@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=465

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional overrides
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
GITHUB_REDIRECT_URI=http://localhost:8000/api/auth/github/callback
FRONTEND_URL=http://localhost:5173
```

> When `MAIL_USERNAME` is not set, verification codes are printed to the console instead of sent by email — convenient for local development.

---

## Development

### Backend

```bash
cd backend && source venv/bin/activate

pytest          # run all tests
pytest -v       # verbose
pytest tests/test_auth.py   # single file
```

### Frontend

```bash
cd frontend

npx vitest run          # run all tests
npx vitest run src/store/__tests__/authStore.test.ts  # single file
npm run build           # TypeScript check + production build
npm run lint
```

---

## Project Structure

```
backend/
├── main.py          # FastAPI app, CORS, router registration
├── database.py      # SQLAlchemy engine & session
├── models.py        # User, Todo ORM models
├── schemas.py       # Pydantic request/response schemas
└── routers/
    ├── auth.py      # Register, login, email verification, password reset
    ├── oauth.py     # Google & GitHub OAuth 2.0
    └── todos.py     # Todo CRUD

frontend/src/
├── api/axios.ts         # Axios instance with auth interceptors
├── store/
│   ├── authStore.ts     # Zustand auth state
│   └── todoStore.ts     # Zustand todo state
├── components/
│   ├── TodoForm.tsx
│   ├── TodoItem.tsx
│   ├── TodoList.tsx
│   ├── FilterBar.tsx
│   ├── DateTimePicker.tsx
│   └── Navbar.tsx
└── pages/
    ├── LoginPage.tsx
    ├── RegisterPage.tsx
    ├── ForgotPasswordPage.tsx
    ├── OAuthCallbackPage.tsx
    └── TodoPage.tsx
```
