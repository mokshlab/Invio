# Invio — AI-Powered Invoice Management

A full-stack invoice management platform with AI-powered generation, real-time analytics, and automated workflows — built with the MERN stack and Google Gemini.

> **[Live Demo](https://invio-iota.vercel.app)** · Deployed on Vercel + Render

![MERN](https://img.shields.io/badge/Stack-MERN-green)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Node](https://img.shields.io/badge/Node.js-18+-339933)

---

## What It Does

Invio lets users create, manage, and send professional invoices — either manually or through natural language AI generation. Users describe what they need in plain English, and Gemini converts it into structured invoice data. The platform includes a full analytics dashboard, automated overdue detection, email integration, and shareable public invoice links.

---

## Key Features

**Invoice Management** — Full CRUD with auto-generated sequential invoice numbers, enforced status lifecycle (Draft → Sent → Paid/Overdue), PDF export, bulk operations, and an activity audit trail for every action.

**AI Integration** — Natural language invoice generation, smart payment reminder emails with adjustable tone, and business insights from historical data — all powered by Google Gemini 2.5 Flash.

**Authentication & Security** — JWT access/refresh token flow with httpOnly cookies, mutex-based silent refresh for concurrent 401s, tiered rate limiting (global/auth/AI), Zod schema validation with field-level max lengths on every route, MongoDB injection sanitization, and sort-field whitelisting.

**Dashboard & Analytics** — Revenue trends with Recharts, status breakdown, top clients, payment health scoring, and an AI-powered insights widget.

**Email System** — Send styled HTML invoices and AI-generated reminders via SMTP, with graceful fallback to console logging when credentials aren't configured.

**Automated Workflows** — Daily cron job scans for overdue invoices and auto-transitions status. Token-based public sharing for client-facing read-only invoice views.

**UX & Accessibility** — Dark mode with system preference detection, skeleton loaders, animated transitions (Framer Motion), error boundary with recovery UI, responsive mobile-first design with semantic ARIA labelling.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite 5, Tailwind CSS, Framer Motion, Recharts, Lucide React |
| Backend | Node.js, Express, Mongoose, Zod, Helmet, express-rate-limit, node-cron |
| Database | MongoDB Atlas |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT (access + refresh), bcryptjs |
| Email | Nodemailer |
| Testing | Vitest, React Testing Library |
| Deployment | Vercel (client) + Render (server) |

---

## Project Structure

```
Invio/
├── client/                     # React SPA (Vite)
│   └── src/
│       ├── components/
│       │   ├── common/         # Reusable UI (loaders, error boundary, etc.)
│       │   └── layout/         # Header, Sidebar, AuthLayout
│       ├── context/            # Auth & Theme providers
│       ├── pages/              # Route-level page components
│       ├── services/           # API client with interceptors
│       ├── utils/              # Formatting, PDF export, password strength
│       └── test/               # Unit tests (Vitest)
│
├── server/                     # Express API
│   ├── config/                 # DB connection, env validation
│   ├── controllers/            # Route handlers (auth, invoice, AI, profile)
│   ├── middleware/             # Auth guard, error handler, Zod validation
│   ├── models/                 # Mongoose schemas (User, Invoice, AuditLog)
│   ├── routes/                 # Express routers
│   ├── services/               # Business logic (email, AI, cron, audit)
│   ├── utils/                  # AppError, token generation
│   └── validators/             # Zod schemas per domain
│
└── docs/
    └── API.md                  # Full API reference
```

---

## API Overview

Full endpoint documentation in [`docs/API.md`](docs/API.md).

| Group | Endpoints | Auth |
|-------|----------|------|
| **Auth** | `POST /signup`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` | Public (signup/login/refresh), Protected (me) |
| **Invoices** | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /stats`, `POST /:id/send`, `POST /bulk-delete` | Protected |
| **Profile** | `GET /`, `PUT /`, `PUT /password` | Protected |
| **AI** | `POST /generate-invoice`, `POST /payment-reminder`, `POST /send-reminder`, `GET /insights` | Protected |
| **Public** | `GET /public/invoices/:token` | None |

---

## Notable Technical Decisions

1. **Race-Condition Safe Invoice Numbers** — Sequential `INV-YYYY-NNNN` generation uses a retry loop that catches MongoDB E11000 duplicate key errors from concurrent requests, retrying with the next number up to 3 times.

2. **Mutex-Based Token Refresh** — When multiple API calls receive 401 simultaneously, a mutex ensures only one refresh request fires. All other calls queue and replay automatically once the single refresh completes — preventing token refresh storms.

3. **Tiered Rate Limiting** — Three separate rate limit pools (global: 200/15min, auth: 15/15min, AI: 50/15min) protect different threat surfaces: infrastructure overload, brute force login, and expensive AI API abuse.

4. **Status Transition Enforcement** — Invoice status changes are validated server-side against a state machine (draft→sent→paid/overdue). The API rejects invalid transitions regardless of what the client sends.

5. **Cross-Domain Cookie Auth** — Production deployment across Vercel (frontend) and Render (backend) required `sameSite: 'none'` + `secure: true` cookie configuration with reverse proxy trust, while keeping `strict` mode for local development.

6. **Defensive Query Handling** — User search input is regex-escaped before compilation, sort parameters are validated against a whitelist, and pagination is capped server-side to prevent abuse through query string manipulation.

---

## Setup

Requires **Node.js ≥ 18** and a **MongoDB** instance.

```bash
git clone https://github.com/mokshlab/Invio.git
cd Invio
```

### Server

```bash
cd server
npm install
```

Create `server/.env` with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `PORT` | No | Server port (default: `5000`) |
| `GEMINI_API_KEY` | No | Google Gemini API key — AI features disabled without it |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender email address |

```bash
npm run dev    # development with nodemon
npm start      # production
npm run seed   # populate demo data
npm test       # run server tests
```

### Client

```bash
cd client
npm install
```

Optionally set `VITE_API_URL` in `client/.env` if the backend isn't at the default proxy path.

```bash
npm run dev        # development server
npm run build      # production build
npm test           # run client tests
```

---

## Testing

```bash
# Client unit tests (Vitest + React Testing Library)
cd client && npm test

# Server unit tests (Vitest)
cd server && npm test
```

Tests cover:
- **Server**: Zod validator schemas, status transition enforcement, utility functions
- **Client**: Formatting utilities, password strength scoring, component rendering

---

## Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set **Root Directory** to `server`
3. **Build Command**: `npm install` · **Start Command**: `node server.js`
4. Add environment variables in Render dashboard
5. Health check path: `/api/health`

### Frontend → Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. Framework preset: **Vite** (auto-detected)
4. Set `VITE_API_URL` to your Render backend URL + `/api`
5. Deploy — `vercel.json` handles SPA rewrites automatically

### Cross-Domain Notes

- Cookies use `sameSite: 'none'` and `secure: true` in production for cross-origin auth
- CORS is configured with `credentials: true` and the Vercel frontend URL as `origin`
- Render provides HTTPS by default (required for secure cookies)

---

## License

MIT
