# 3D Learning: The Third Dimension Learning Institute

Online tutoring platform with **separate logins for Students, Tutors and the Owner (admin)**.
React (Vite) front end, Node/Express API, SQL database (SQLite locally, PostgreSQL in production).
Responsive layout for desktop and mobile.

## Features

| Area | What it does |
| --- | --- |
| Tutor directory | Search and filter tutors, read their CV, watch an intro video (YouTube/Vimeo), see ratings and reviews |
| Conflict-free scheduling | 60-minute slots generated from each tutor's weekly availability. Booked or held slots disappear, and the server re-checks tutor and student clashes. Unpaid bookings hold a slot for 15 minutes |
| Video lessons | Every confirmed booking gets a private Jitsi Meet room; "Join" unlocks 15 minutes before the start |
| Payments | Checkout, receipts, automatic refund when a tutor/owner cancels or a student cancels 2+ hours ahead (built-in **test gateway**, see below) |
| Progress analytics | Tutors record score and notes per lesson; students see line and bar charts. Tutors see earnings charts, the owner sees revenue and user stats |
| Live messaging | Student/tutor/owner chat with unread counts (updates every 3 seconds) |
| Owner portal | Approve or suspend tutors, add users, view all sessions, payments and progress records |

Roles: `student` (self sign-up), `tutor` (self sign-up, needs owner approval to appear publicly), `admin` (the owner, seeded on first start).

## Run locally in VS Code

Requires Node.js 18 or newer.

```bash
npm run install:all     # installs server and client dependencies
npm run dev             # API on :4000 and React on :5173
```

Open http://localhost:5173. The SQLite database file `server/data.db` is created automatically.

Seeded accounts (change them before going live):

| Role | Email | Password |
| --- | --- | --- |
| Owner | admin@3dlearning.com | Admin@12345 |
| Tutor | ayesha@3dlearning.com | Tutor@12345 |
| Student | student@3dlearning.com | Student@12345 |

Sign-in pages: `/login/student`, `/login/tutor`, `/login/admin`.

## Environment variables (server)

See `server/.env.example`. Key ones: `DATABASE_URL` (PostgreSQL; empty means SQLite), `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO`, `CLIENT_ORIGIN`.
Client: `VITE_API_URL` (only when the API is on a different domain).

## Upload to GitHub

```bash
git init            # skip if already initialised
git add .
git commit -m "3D Learning platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Create the empty repository on github.com first. `.env` files and `node_modules` are already git-ignored.

## Deploy on Render (API + database + website in one service)

1. Render dashboard, **New**, **Blueprint**, pick your GitHub repo. It reads `render.yaml` and creates the web service and a free PostgreSQL database.
2. When prompted, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (your owner login). `JWT_SECRET` is generated for you.
3. After the first deploy, open the service URL. The API and the React app are both served from it.

Note: Render's free Postgres database expires after a limited period. Use a paid plan, or point `DATABASE_URL` at Neon or Supabase, for long-term use.

## Deploy the React app on Vercel (talking to the Render API)

1. Vercel, **Add New Project**, import the repo, set **Root Directory** to `client`.
2. Add environment variable `VITE_API_URL` = your Render URL (for example `https://3d-learning.onrender.com`).
3. Deploy. Then on Render add your Vercel domain to `CLIENT_ORIGIN` (comma-separated if several) so the API accepts it, and redeploy the API.

## Notes and limits

- **Payments use a built-in test gateway.** It validates the card (Luhn, expiry, CVC), stores only the last 4 digits and records the payment, but moves no real money. To take real payments, replace the marked block in `POST /api/bookings/:id/pay` in `server/src/app.js` with Stripe or PayPal.
- Messaging uses polling rather than WebSockets, which keeps deployment simple on free hosting.
- Render's free web service sleeps when idle, so the first request after a pause is slow.
- The visual design follows the editorial style of edemis.com (serif headlines, navy and warm gold palette, card layout). It is not a copy of their site, assets or text.
