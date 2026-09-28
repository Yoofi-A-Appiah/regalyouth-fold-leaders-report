# Regal Youth Ministry — Fold Follow-Up & Reporting System

A modern Next.js web application for fold leaders, member visitation reports, prayer requests, event attendance tracking, and ministry analytics, powered by Neon Serverless PostgreSQL.

## 🚀 Features

- **Leader Portal & Fold Dashboard:**
  - Quick 1-tap fold login or manual Leader ID verification (e.g. `FL-001`).
  - Active reporting period tracking (e.g. `2026-09-B`) with completion progress bar.
  - Member cards with instant search and status badges (*Follow-Up*, *Visitation*, *Prayer*, *Needs Info*).
  - Quick-action buttons to phone call and WhatsApp youth directly.
- **Reporting Forms:**
  - **Follow-Up Report:** Contact method, occasion/context, youth response, and prayer needs.
  - **Home Visitation Report:** Visitation reasons, family environment observations, and agreed next steps.
  - **Prayer List:** Flag youth for central pastoral intercession with reason and date.
  - **Needs Info:** Flag members whose contact info or residence needs verification.
  - **Member History:** View all past interactions and reports for each specific youth.
- **Event Attendance Hub:**
  - Track attendance for youth events (Youth Meetings, Sunday Services, Outreach & Training).
  - One-click *Mark All Present* with real-time present/absent counters.
- **Central Ministry Admin Portal:**
  - Overview metrics: total lifetime submissions, current period submissions, active shepherds, and youth roster.
  - **Events Manager:** Create and publish church events.
  - **Leader Performance:** Real-time completion rates per fold with clean print/PDF export.
  - **Membership Directory:** Search, add youth, and reassign/move members across folds.
  - **Prayer Wall & Needs Info:** Centralized pastoral dashboards.
  - **Random Youth Picker:** "Wheel of Names" generator for youth icebreakers and quizzes with history.
  - **Neon Database Manager:** Live connection health check and migration status.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Neon PostgreSQL
Create or update `.env.local` with your Neon database connection string:
```bash
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/neondb?sslmode=require"
```
*(Note: If `DATABASE_URL` is omitted, the application runs seamlessly in local in-memory mode using the full seeded youth roster).*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Architecture (Neon Postgres)

The application automatically provisions and seeds the following PostgreSQL tables on first connection:
- `leaders`: Fold leader ID, full name, and timestamp.
- `members`: Youth members linked to fold leader with contact numbers.
- `followups`: Periodic follow-up reports.
- `visitations`: Home visit notes and pastoral observations.
- `prayer_list`: Central prayer items with active status.
- `needs_info_list`: Members requiring contact updates.
- `events`: Scheduled ministry events.
- `attendance`: Event attendance records per youth and fold.

---

## 🔄 Legacy Google Apps Script Compatibility

The Next.js backend includes `/api/fold-report` which supports both `GET ?action=...` and `POST { action: ... }` identical to the legacy Google Apps Script backend (`getRoster`, `getSubmissions`, `getAdminStats`, `getPrayerList`, `addSubmission`, `addLeader`, `addMember`, etc.).
