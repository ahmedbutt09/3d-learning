# The Third Dimension Learning Institute (3D Learning)

A full-stack, cross-platform, reactive online tutoring platform built with **React (Vite)**, **Node.js / Express**, and a **connected SQL database** (native SQLite locally, PostgreSQL on Render).

Designed in the minimalist, prestigious British academic style of **[edemis.com](https://edemis.com)** (midnight navy `#0B1B2B`, warm ivory `#F8F6F0`, and gold accents with elegant serif headlines), while incorporating **all functionalities and features from the 3D Learning Studio App**:
- **Separate Logins** for Students, Tutors, and Institute Owner (Admin)
- **Top Bar Mode Switcher**: Quick toggle between *Student View*, *Tutor View*, and *Owner (Admin) View*
- **6 Core Academic Hub Sections**:
  1. **Official Curriculum (Subjects Offered)**: 10 subject tracks (Mathematics, English Language, Sciences, Biology, Chemistry, Physics, Biochemistry, History, GCSE/AP History, Quran Classes) with sub-discipline pills, grade levels, and instant 1-click scheduling.
  2. **Tutors & CVs Directory**: Search, subject filtering, CV transcripts, intro videos, 168-hour weekly availability status, and "+ Add Tutor & Upload CV" studio.
  3. **Master Class Schedule**: 24h × 7-day availability matrix with real-time overlap protection and conflict-free booking.
  4. **Student Academic Portal & Dashboard**: 4 key performance metrics, scheduled video lessons with instant Jitsi Meet classroom links, integrated USD payment history ledger, and real-time automated email dispatches.
  5. **Direct Faculty Messaging**: Secure in-app communication with topic pills (*Free Trial*, *Homework Help*, *Exam Revision*) and real-time polling.
  6. **Student Reviews & Ratings**: Testimonials feed highlighting academic outcomes (*"Exam grade improved from B to A*"*) and interactive rating submission form.
- **Interactive Modals**:
  - **Schedule Session Modal**: 4-step wizard (Day selector, 24-hour slot picker, fee presets $0-$50, Free Trial / Card / Credit payment, automated email dispatch).
  - **Tutor Profile & CV Modal**: 4 tabs (Curriculum Vitae, Video Player & Syllabus, 168-Slot Availability, Student Reviews).
  - **Add Tutor & Upload CV Studio Modal**: Full faculty profile builder, CV file parser, and interactive 168-hour availability grid.

---

## 🚀 Running Locally in VS Code

### Prerequisites
- Node.js 18 or newer (Node 20, 22, and 24 are fully supported).

### Step 1: Install Dependencies
Open your terminal in the project root:
```bash
npm run install:all
```
*(Installs both client and server dependencies)*

### Step 2: Start Development Server
```bash
npm run dev
```
- API server runs on: `http://localhost:4000`
- React Vite application runs on: `http://localhost:5173`

The database (`server/data.db`) is automatically initialized and seeded with demo tutors, curriculum subjects, student profile, availability slots, and reviews on first boot.

---

## 👥 Seeded Accounts & Separate Logins

| Role | Email | Password | Direct Login URL |
| :--- | :--- | :--- | :--- |
| **Institute Owner (Admin)** | `admin@3dlearning.com` | `Admin@12345` | `/login/admin` |
| **Faculty Tutor** | `ayesha@3dlearning.com` | `Tutor@12345` | `/login/tutor` |
| **Student** | `student@3dlearning.com` | `Student@12345` | `/login/student` |

*Note: You can also register new student or tutor accounts at `/register`, or use the **"Mode" pill** in the top navigation bar to instantly switch view modes.*

---

## 🌐 Deploying to Production

### 1. Upload to GitHub
1. Create a new empty repository on [GitHub](https://github.com/new) (e.g., `3d-learning`).
2. Run the following commands in your project root:
```bash
git add .
git commit -m "feat: complete 3D Learning institute platform"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

### 2. Deploy on Render (API + PostgreSQL + React in One Service)
The repository includes a ready-to-use `render.yaml` Blueprint.

1. Go to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   - Web service (`Node.js`, build: `npm run build`, start: `npm start`).
   - Managed PostgreSQL database (`3d-learning-db`).
5. When prompted for environment variables:
   - `ADMIN_EMAIL`: Set your owner email (e.g., `admin@3dlearning.com`).
   - `ADMIN_PASSWORD`: Set a secure owner password.
6. Click **Apply**. Once deployed, your web application will be live at `https://<your-render-subdomain>.onrender.com`.

---

### 3. Deploy Frontend on Vercel (Optional Separated Frontend)
If you prefer hosting the React client separately on Vercel:

1. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variable:
   - `VITE_API_URL`: `https://<your-render-service>.onrender.com` (your Render backend URL).
5. Click **Deploy**.
6. On Render, add your Vercel domain to the `CLIENT_ORIGIN` environment variable so CORS allows requests.

---

## 🛡️ Built-in Conflict-Free Scheduling & Test Gateway
- **Slot Conflict Engine**: Checks availability and locks existing slots to ensure zero double-booking.
- **Jitsi Meet Integration**: Automatically generates a private, tamper-proof video classroom link (`https://meet.jit.si/3DLearning-<id>`) for every session.
- **Payment Gateway**: Validates card numbers (Luhn algorithm), expiry format, and CVC, and records payments and receipts without storing raw card data.
