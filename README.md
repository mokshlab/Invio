# Invio — AI-Powered Invoice Management

A production-ready full-stack invoice management platform with AI-powered generation, real-time analytics, and automated workflows — built with the MERN stack and Google Gemini.

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

**Invoice Management** — Full CRUD with auto-generated sequential invoice numbers, status lifecycle (Draft → Sent → Paid → Overdue), PDF export, bulk operations, and an activity audit trail for every invoice action.

**AI Integration** — Natural language invoice generation, smart payment reminder emails with adjustable tone, and business insights derived from historical invoice data — all powered by Google Gemini 2.5 Flash.

**Authentication & Security** — JWT access/refresh token flow with httpOnly cookies, silent refresh using a mutex pattern to handle concurrent 401s, tiered rate limiting across global/auth/AI endpoints, Zod schema validation on all routes, MongoDB injection sanitization, and sort-field whitelisting.

**Dashboard & Analytics** — Revenue trends with Recharts, status breakdown, top clients, payment health scoring, and an AI-powered insights widget.

**Email System** — Send styled HTML invoices and AI-generated reminders via SMTP, with graceful fallback to console logging when credentials aren't configured.

**Automated Workflows** — Daily cron job scans for unpaid invoices past their due date and auto-transitions them to overdue status. Token-based public sharing for client-facing read-only invoice views.

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
| Deployment | Vercel (client) + Render (server) |

---

## Notable Technical Decisions

1. **Race-Condition Safe Invoice Numbers** — Sequential `INV-YYYY-NNNN` generation uses a retry loop that catches MongoDB E11000 duplicate key errors from concurrent requests, retrying with the next number up to 3 times.

2. **Mutex-Based Token Refresh** — When multiple API calls receive 401 simultaneously, a mutex ensures only one refresh request fires. All other calls queue and replay automatically once the single refresh completes — preventing token refresh storms.

3. **Tiered Rate Limiting** — Three separate rate limit pools (global, auth, AI) protect different threat surfaces: infrastructure overload, brute force login, and expensive AI API abuse — each with appropriate thresholds.

4. **Cross-Domain Cookie Auth** — Production deployment across Vercel (frontend) and Render (backend) required `sameSite: 'none'` + `secure: true` cookie configuration with reverse proxy trust, while keeping `strict` mode for local development.

5. **Defensive Query Handling** — User search input is regex-escaped before compilation, sort parameters are validated against a whitelist, and pagination is capped server-side to prevent abuse through query string manipulation.

---

## Setup

Requires Node.js ≥ 18, MongoDB, and a Google Gemini API key.

```bash
git clone https://github.com/mokshlab/Invio.git
cd Invio

cd server && npm install
cd ../client && npm install

# Configure server/.env (see .env.example)
# Run server: cd server && npm run dev
# Run client: cd client && npm run dev
```

---

## License

MIT

---

## Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set **Root Directory** to `server`
3. Set **Build Command**: `npm install` and **Start Command**: `node server.js`
4. Add environment variables in Render dashboard:
   - `NODE_ENV=production`
   - `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `CLIENT_URL=https://your-app.vercel.app`
   - `GEMINI_API_KEY` (optional)
   - `SMTP_*` (optional)
5. Health check path: `/api/health`

### Frontend → Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. Framework preset: **Vite** (auto-detected)
4. Add environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy — `vercel.json` handles SPA rewrites automatically

### Cross-Domain Notes

- Cookies use `sameSite: 'none'` and `secure: true` in production for cross-origin auth
- CORS is configured with `credentials: true` and the Vercel frontend URL as `origin`
- Render provides HTTPS by default (required for secure cookies)

---

## License

MIT
