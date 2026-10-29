import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { query, one } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Set it in production.');
}
const SESSION_MINUTES = 60;
const HOLD_MINUTES = 15; // unpaid bookings hold a slot this long

const now = () => new Date().toISOString();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status };
}

function auth(...roles) {
  return wrap(async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return bad(res, 'Please sign in', 401);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return bad(res, 'Session expired, please sign in again', 401);
    }
    const user = await one(`SELECT * FROM users WHERE id = ?`, [payload.sub]);
    if (!user) return bad(res, 'Account not found', 401);
    if (user.status === 'suspended') return bad(res, 'This account is suspended', 403);
    if (roles.length && !roles.includes(user.role)) return bad(res, 'Not allowed', 403);
    req.user = user;
    next();
  });
}

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function luhn(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// ---- Scheduling ----------------------------------------------------------
async function expireHolds() {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60000).toISOString();
  await query(`UPDATE bookings SET status = 'cancelled' WHERE status = 'pending_payment' AND created_at < ?`, [cutoff]);
}

async function busyFor(column, id) {
  await expireHolds();
  const rows = await query(
    `SELECT start_at, end_at FROM bookings WHERE ${column} = ? AND status IN ('confirmed','pending_payment') AND end_at > ?`,
    [id, now()]
  );
  return rows.map((r) => ({ start: Date.parse(r.startAt), end: Date.parse(r.endAt) }));
}

function computeSlots(profile, avail, busy, days = 14) {
  const off = Number(profile.tzOffset || 0); // minutes ahead of UTC
  const minStart = Date.now() + 15 * 60000;
  const local = new Date(Date.now() + off * 60000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const slots = [];
  for (let i = 0; i < days; i++) {
    const dayMs = Date.UTC(y, m, d + i);
    const weekday = new Date(dayMs).getUTCDay();
    for (const a of avail.filter((x) => Number(x.weekday) === weekday)) {
      for (let mins = Number(a.startMin); mins + SESSION_MINUTES <= Number(a.endMin); mins += SESSION_MINUTES) {
        const start = dayMs + mins * 60000 - off * 60000;
        const end = start + SESSION_MINUTES * 60000;
        if (start < minStart) continue;
        if (busy.some((b) => start < b.end && end > b.start)) continue;
        slots.push(new Date(start).toISOString());
      }
    }
  }
  return [...new Set(slots)].sort();
}

// ---- App -----------------------------------------------------------------
export function createApp() {
  const app = express();
  const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true }));
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true, time: now() }));

  // ---- Auth ----
  app.post('/api/auth/register', wrap(async (req, res) => {
    const { name, email, password, role } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) return bad(res, 'Name, email and password are required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, 'Enter a valid email address');
    if (password.length < 8) return bad(res, 'Password must be at least 8 characters');
    if (!['student', 'tutor'].includes(role)) return bad(res, 'Choose student or tutor');
    if (await one(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()])) return bad(res, 'That email is already registered', 409);
    const id = randomUUID();
    const status = role === 'tutor' ? 'active' : 'active';
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), email.toLowerCase(), bcrypt.hashSync(password, 10), role, status, now()]
    );
    if (role === 'tutor') {
      await query(`INSERT INTO tutor_profiles (user_id, headline, hourly_rate) VALUES (?, 'Educator at The Third Dimension Learning Institute', 25)`, [id]);
      for (let weekday = 0; weekday <= 6; weekday++) {
        await query(`INSERT INTO availability (id, tutor_id, weekday, start_min, end_min) VALUES (?, ?, ?, 0, 1440)`, [randomUUID(), id, weekday]);
      }
    }
    const user = await one(`SELECT * FROM users WHERE id = ?`, [id]);
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  }));

  app.post('/api/auth/login', wrap(async (req, res) => {
    const { email, password, role } = req.body || {};
    const user = await one(`SELECT * FROM users WHERE email = ?`, [String(email || '').toLowerCase()]);
    if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) return bad(res, 'Incorrect email or password', 401);
    if (role && user.role !== role) return bad(res, `This account is not a ${role} account`, 403);
    if (user.status === 'suspended') return bad(res, 'This account is suspended', 403);
    res.json({ token: sign(user), user: publicUser(user) });
  }));

  app.get('/api/auth/me', auth(), (req, res) => res.json({ user: publicUser(req.user) }));

  app.put('/api/me', auth(), wrap(async (req, res) => {
    const { name, password } = req.body || {};
    if (name?.trim()) await query(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), req.user.id]);
    if (password) {
      if (password.length < 8) return bad(res, 'Password must be at least 8 characters');
      await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [bcrypt.hashSync(password, 10), req.user.id]);
    }
    const user = await one(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    res.json({ user: publicUser(user) });
  }));

  // ---- Tutors (public) ----
  const tutorSelect = `
    SELECT u.id, u.name, u.email, u.status, p.headline, p.bio, p.subjects, p.levels, p.hourly_rate,
      p.cv_text, p.video_url, p.tz_offset, p.education, p.experience, p.certifications,
      p.study_materials, p.topics, p.avatar_url, p.cv_filename,
      (SELECT AVG(r.rating) FROM reviews r WHERE r.tutor_id = u.id) AS rating,
      (SELECT CAST(COUNT(*) AS INTEGER) FROM reviews r WHERE r.tutor_id = u.id) AS review_count
    FROM users u JOIN tutor_profiles p ON p.user_id = u.id`;

  app.get('/api/tutors', wrap(async (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const subject = String(req.query.subject || '').toLowerCase();
    let tutors = await query(`${tutorSelect} WHERE u.role = 'tutor' AND u.status = 'active' ORDER BY u.name`);
    tutors = tutors.filter((t) => {
      const hay = `${t.name} ${t.headline} ${t.subjects} ${t.levels} ${t.topics || ''}`.toLowerCase();
      return (!q || hay.includes(q)) && (!subject || t.subjects.toLowerCase().includes(subject));
    });
    res.json({ tutors });
  }));

  app.get('/api/tutors/:id', wrap(async (req, res) => {
    const tutor = await one(`${tutorSelect} WHERE u.id = ? AND u.role = 'tutor'`, [req.params.id]);
    if (!tutor || tutor.status !== 'active') return bad(res, 'Tutor not found', 404);
    const reviews = await query(
      `SELECT r.*, COALESCE(s.name, r.student_name) AS student_name
       FROM reviews r LEFT JOIN users s ON s.id = r.student_id
       WHERE r.tutor_id = ? ORDER BY r.created_at DESC LIMIT 50`,
      [tutor.id]
    );
    res.json({ tutor, reviews });
  }));

  app.get('/api/tutors/:id/slots', wrap(async (req, res) => {
    const tutor = await one(`${tutorSelect} WHERE u.id = ? AND u.role = 'tutor' AND u.status = 'active'`, [req.params.id]);
    if (!tutor) return bad(res, 'Tutor not found', 404);
    const avail = await query(`SELECT * FROM availability WHERE tutor_id = ?`, [tutor.id]);
    const slots = computeSlots(tutor, avail, await busyFor('tutor_id', tutor.id));
    res.json({ slots, durationMinutes: SESSION_MINUTES });
  }));

  // Create Tutor Profile (used by "+ Add Tutor & Upload CV" modal)
  app.post('/api/tutors', wrap(async (req, res) => {
    const b = req.body || {};
    if (!b.name?.trim()) return bad(res, 'Tutor full name is required');
    const email = (b.email || `${b.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'tutor'}-${Date.now().toString(36)}@3dlearning.com`).toLowerCase();
    
    let tutor = await one(`SELECT * FROM users WHERE email = ?`, [email]);
    let tutorId;
    if (tutor) {
      tutorId = tutor.id;
    } else {
      tutorId = randomUUID();
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, 'tutor', 'active', ?)`,
        [tutorId, b.name.trim(), email, bcrypt.hashSync(b.password || 'Tutor@12345', 10), now()]
      );
    }

    const rate = Math.max(0, parseInt(b.hourlyRate !== undefined ? b.hourlyRate : 25, 10));
    const subjects = String(b.subjects || b.primarySubject || 'Mathematics').trim();
    const levels = String(b.levels || 'Elementary, Middle & High School').trim();

    await query(
      `INSERT INTO tutor_profiles (
        user_id, headline, bio, subjects, levels, hourly_rate, cv_text, video_url, tz_offset,
        education, experience, certifications, study_materials, topics, avatar_url, cv_filename
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        headline=excluded.headline, bio=excluded.bio, subjects=excluded.subjects, levels=excluded.levels,
        hourly_rate=excluded.hourly_rate, cv_text=excluded.cv_text, video_url=excluded.video_url,
        education=excluded.education, experience=excluded.experience, certifications=excluded.certifications,
        study_materials=excluded.study_materials, topics=excluded.topics, avatar_url=excluded.avatar_url,
        cv_filename=excluded.cv_filename`,
      [
        tutorId,
        String(b.headline || `${b.primarySubject || subjects.split(',')[0]} Tutor at The Third Dimension Learning Institute`),
        String(b.bio || `${b.name} provides expert tuition across ${subjects}.`),
        subjects,
        levels,
        rate,
        String(b.cvText || ''),
        String(b.videoUrl || ''),
        String(b.education || ''),
        String(b.experience || ''),
        String(b.certifications || ''),
        String(b.studyMaterials || ''),
        String(b.topics || ''),
        String(b.avatarUrl || ''),
        String(b.cvFilename || '')
      ]
    );

    // Save weekly availability
    await query(`DELETE FROM availability WHERE tutor_id = ?`, [tutorId]);
    if (Array.isArray(b.availability) && b.availability.length > 0) {
      for (const a of b.availability) {
        await query(`INSERT INTO availability (id, tutor_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?, ?)`, [
          randomUUID(), tutorId, Number(a.weekday), Number(a.startMin), Number(a.endMin)
        ]);
      }
    } else {
      // Default open all 168 slots (24 hours x 7 days)
      for (let w = 0; w <= 6; w++) {
        await query(`INSERT INTO availability (id, tutor_id, weekday, start_min, end_min) VALUES (?, ?, ?, 0, 1440)`, [
          randomUUID(), tutorId, w
        ]);
      }
    }

    const created = await one(`${tutorSelect} WHERE u.id = ?`, [tutorId]);
    res.status(201).json({ tutor: created });
  }));

  // ---- Tutor self-service ----
  app.get('/api/tutor/profile', auth('tutor'), wrap(async (req, res) => {
    const profile = await one(`${tutorSelect} WHERE u.id = ?`, [req.user.id]);
    const availability = await query(`SELECT weekday, start_min, end_min FROM availability WHERE tutor_id = ? ORDER BY weekday, start_min`, [req.user.id]);
    res.json({ profile, availability });
  }));

  app.put('/api/tutor/profile', auth('tutor'), wrap(async (req, res) => {
    const b = req.body || {};
    const rate = Math.max(0, Math.min(1000, parseInt(b.hourlyRate, 10) || 25));
    const tz = Math.max(-720, Math.min(840, parseInt(b.tzOffset, 10) || 0));
    if (b.name?.trim()) await query(`UPDATE users SET name = ? WHERE id = ?`, [b.name.trim(), req.user.id]);
    await query(
      `UPDATE tutor_profiles SET headline = ?, bio = ?, subjects = ?, levels = ?, hourly_rate = ?, cv_text = ?, video_url = ?, tz_offset = ?,
       education = ?, experience = ?, certifications = ?, study_materials = ?, topics = ?, avatar_url = ? WHERE user_id = ?`,
      [
        String(b.headline || ''), String(b.bio || ''), String(b.subjects || ''), String(b.levels || ''), rate,
        String(b.cvText || ''), String(b.videoUrl || ''), tz,
        String(b.education || ''), String(b.experience || ''), String(b.certifications || ''),
        String(b.studyMaterials || ''), String(b.topics || ''), String(b.avatarUrl || ''), req.user.id
      ]
    );
    res.json({ ok: true });
  }));

  app.put('/api/tutor/availability', auth('tutor'), wrap(async (req, res) => {
    const list = Array.isArray(req.body?.availability) ? req.body.availability : [];
    const clean = [];
    for (const a of list) {
      const weekday = Number(a.weekday);
      const start = Number(a.startMin);
      const end = Number(a.endMin);
      if (!(weekday >= 0 && weekday <= 6) || !(start >= 0 && end <= 1440 && end - start >= 30)) {
        return bad(res, 'Each availability window must be at least 30 minutes and within one day');
      }
      clean.push({ weekday, start, end });
    }
    await query(`DELETE FROM availability WHERE tutor_id = ?`, [req.user.id]);
    for (const a of clean) {
      await query(`INSERT INTO availability (id, tutor_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?, ?)`, [randomUUID(), req.user.id, a.weekday, a.start, a.end]);
    }
    res.json({ ok: true });
  }));

  app.get('/api/tutor/students', auth('tutor'), wrap(async (req, res) => {
    const students = await query(
      `SELECT u.id, u.name, u.email, CAST(COUNT(b.id) AS INTEGER) AS sessions
       FROM bookings b JOIN users u ON u.id = b.student_id
       WHERE b.tutor_id = ? AND b.status IN ('confirmed','completed')
       GROUP BY u.id, u.name, u.email ORDER BY u.name`,
      [req.user.id]
    );
    res.json({ students });
  }));

  // ---- Master Schedule endpoint ----
  app.get('/api/schedule/master', wrap(async (req, res) => {
    const tutors = await query(`${tutorSelect} WHERE u.role = 'tutor' AND u.status = 'active' ORDER BY u.name`);
    const allAvail = await query(`SELECT * FROM availability`);
    const activeBookings = await query(
      `SELECT id, tutor_id, student_id, start_at, end_at, status, subject, topic FROM bookings WHERE status IN ('confirmed', 'pending_payment') AND end_at > ?`,
      [now()]
    );
    res.json({ tutors, availability: allAvail, bookings: activeBookings });
  }));

  // ---- Reviews (public feed + submission) ----
  app.get('/api/reviews', wrap(async (req, res) => {
    const tutorId = req.query.tutorId;
    let sql = `SELECT r.*, t.name as tutor_name, p.subjects as tutor_subjects FROM reviews r JOIN users t ON t.id = r.tutor_id JOIN tutor_profiles p ON p.user_id = t.id`;
    const params = [];
    if (tutorId) {
      sql += ` WHERE r.tutor_id = ?`;
      params.push(tutorId);
    }
    sql += ` ORDER BY r.created_at DESC LIMIT 100`;
    const reviews = await query(sql, params);
    res.json({ reviews });
  }));

  app.post('/api/reviews', wrap(async (req, res) => {
    const { tutorId, studentName, gradeLevel, outcome, rating, comment } = req.body || {};
    if (!tutorId) return bad(res, 'Select a tutor');
    const r = parseInt(rating, 10);
    if (!(r >= 1 && r <= 5)) return bad(res, 'Rating must be 1 to 5 stars');
    const id = randomUUID();
    await query(
      `INSERT INTO reviews (id, tutor_id, student_name, grade_level, outcome, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tutorId,
        String(studentName || 'Anonymous Student').trim(),
        String(gradeLevel || 'High School Student · 3D Learning Curriculum').trim(),
        String(outcome || 'Exam grade improved from B to A* after live sessions').trim(),
        r,
        String(comment || 'Satisfied with the personalized instruction and syllabus coverage.').trim(),
        now()
      ]
    );
    res.status(201).json({ ok: true, id });
  }));

  // ---- Dispatches / Alerts ----
  app.get('/api/dispatches', auth(), wrap(async (req, res) => {
    const dispatches = await query(`SELECT * FROM dispatches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, [req.user.id]);
    res.json({ dispatches });
  }));

  // ---- Bookings ----
  const bookingSelect = `
    SELECT b.*, s.name AS student_name, t.name AS tutor_name,
      (SELECT r.rating FROM reviews r WHERE r.booking_id = b.id) AS rating
    FROM bookings b JOIN users s ON s.id = b.student_id JOIN users t ON t.id = b.tutor_id`;

  app.get('/api/bookings', auth(), wrap(async (req, res) => {
    await expireHolds();
    const { role, id } = req.user;
    let rows;
    if (role === 'student') rows = await query(`${bookingSelect} WHERE b.student_id = ? ORDER BY b.start_at DESC`, [id]);
    else if (role === 'tutor') rows = await query(`${bookingSelect} WHERE b.tutor_id = ? AND b.status <> 'cancelled' ORDER BY b.start_at DESC`, [id]);
    else rows = await query(`${bookingSelect} ORDER BY b.start_at DESC LIMIT 500`);
    res.json({ bookings: rows });
  }));

  // Schedule Session / Booking endpoint
  app.post('/api/bookings', wrap(async (req, res) => {
    // Resolve user: if bearer token supplied, authenticate; otherwise use default demo student Alex Rivera
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    let studentUser = null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        studentUser = await one(`SELECT * FROM users WHERE id = ?`, [payload.sub]);
      } catch {}
    }
    if (!studentUser) {
      studentUser = await one(`SELECT * FROM users WHERE email = 'student@3dlearning.com'`);
      if (!studentUser) {
        const sid = randomUUID();
        await query(
          `INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, 'student', 'active', ?)`,
          [sid, 'Alex Rivera', 'student@3dlearning.com', bcrypt.hashSync('Student@12345', 10), now()]
        );
        studentUser = await one(`SELECT * FROM users WHERE id = ?`, [sid]);
      }
    }

    const b = req.body || {};
    const tutor = await one(`${tutorSelect} WHERE u.id = ? AND u.role = 'tutor' AND u.status = 'active'`, [b.tutorId]);
    if (!tutor) return bad(res, 'Tutor not found', 404);

    let startAt = b.startAt;
    if (!startAt) {
      const tomorrow = new Date(Date.now() + 24 * 3600000);
      tomorrow.setMinutes(0, 0, 0);
      startAt = tomorrow.toISOString();
    }
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) return bad(res, 'Choose a valid session time');
    const startISO = start.toISOString();
    const durationMin = parseInt(b.durationMin, 10) || 60;
    const endISO = new Date(start.getTime() + durationMin * 60000).toISOString();

    const isFreeTrial = Boolean(b.isFreeTrial || b.paymentOption === 'free_trial' || b.paymentMethod === 'Free Trial ($0)');
    const price = isFreeTrial ? 0 : Math.max(0, parseInt(b.lessonFee !== undefined ? b.lessonFee : tutor.hourlyRate, 10));

    // Overlap conflict check: ensure tutor is not already booked
    const clash = await one(
      `SELECT id FROM bookings WHERE tutor_id = ? AND status = 'confirmed' AND start_at < ? AND end_at > ?`,
      [tutor.id, endISO, startISO]
    );
    if (clash) return bad(res, 'This slot is already booked. Please choose another time.', 409);

    const id = randomUUID();
    const chosenSubject = String(b.subject || tutor.subjects.split(',')[0].trim() || 'Mathematics');
    const topic = String(b.topic || `${chosenSubject}: Live Tutoring & Exam Technique Session`).trim();
    const meetingUrl = `https://meet.jit.si/3DLearning-${id}`;
    const paymentMethod = isFreeTrial ? 'Free Trial ($0)' : (b.paymentOption === 'credit' ? 'Institute Credit' : `Card ending ${(b.cardNumber || '4242').replace(/\s+/g, '').slice(-4)}`);

    const isPaid = isFreeTrial || b.paymentOption === 'credit' || (b.cardNumber && b.cardNumber.length >= 4);
    const status = isPaid ? 'confirmed' : 'pending_payment';

    await query(
      `INSERT INTO bookings (
        id, student_id, tutor_id, subject, topic, start_at, end_at, duration_min, status, meeting_url, price, notes, custom_time, payment_method, is_free_trial, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, studentUser.id, tutor.id, chosenSubject, topic, startISO, endISO, durationMin, status, meetingUrl, price,
        String(b.notes || ''), String(b.customTime || ''), paymentMethod, isFreeTrial ? 1 : 0, now()
      ]
    );

    if (isPaid && price > 0) {
      await query(
        `INSERT INTO payments (id, booking_id, student_id, tutor_id, amount, status, method, reference, created_at)
         VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)`,
        [randomUUID(), id, studentUser.id, tutor.id, price, paymentMethod, `PAY-${Date.now().toString(36).toUpperCase()}`, now()]
      );
    }

    // Insert Automated Email Dispatch Notice
    await query(
      `INSERT INTO dispatches (id, user_id, title, body, type, created_at)
       VALUES (?, ?, ?, ?, 'booking_confirmation', ?)`,
      [
        randomUUID(), studentUser.id,
        `Automated Booking Confirmation & Video Classroom Code`,
        `Your 1-on-1 session with ${tutor.name} (${chosenSubject}) is confirmed for ${new Date(startISO).toLocaleDateString()}. Classroom Code: 3DLearning-${id}. Video room unlocks 15 mins before start. Total Paid: $${price}.00 USD.`,
        now()
      ]
    );

    const booking = await one(`${bookingSelect} WHERE b.id = ?`, [id]);
    res.status(201).json({ booking, studentUser: publicUser(studentUser) });
  }));

  async function loadBooking(req, res) {
    const b = await one(`${bookingSelect} WHERE b.id = ?`, [req.params.id]);
    if (!b) { bad(res, 'Booking not found', 404); return null; }
    const { role, id } = req.user;
    if (role === 'student' && b.studentId !== id) { bad(res, 'Not allowed', 403); return null; }
    if (role === 'tutor' && b.tutorId !== id) { bad(res, 'Not allowed', 403); return null; }
    return b;
  }

  app.post('/api/bookings/:id/pay', auth('student'), wrap(async (req, res) => {
    const b = await loadBooking(req, res);
    if (!b) return;
    if (b.status === 'confirmed') return bad(res, 'Already paid');
    if (b.status !== 'pending_payment') return bad(res, 'This booking can no longer be paid. Please book again.', 409);
    const digits = String(req.body?.cardNumber || '').replace(/\s+/g, '');
    const exp = String(req.body?.expiry || '');
    const cvc = String(req.body?.cvc || '');
    if (!/^\d{13,19}$/.test(digits) || !luhn(digits)) return bad(res, 'Card number is not valid');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return bad(res, 'Expiry must be MM/YY');
    if (!/^\d{3,4}$/.test(cvc)) return bad(res, 'CVC is not valid');
    
    const clash = await one(
      `SELECT id FROM bookings WHERE tutor_id = ? AND id <> ? AND status = 'confirmed' AND start_at < ? AND end_at > ?`,
      [b.tutorId, b.id, b.endAt, b.startAt]
    );
    if (clash) return bad(res, 'This slot was just taken by someone else.', 409);

    await query(
      `INSERT INTO payments (id, booking_id, student_id, tutor_id, amount, status, method, reference, created_at) VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)`,
      [randomUUID(), b.id, b.studentId, b.tutorId, b.price, `Card ending ${digits.slice(-4)}`, `PAY-${Date.now().toString(36).toUpperCase()}`, now()]
    );
    await query(`UPDATE bookings SET status = 'confirmed' WHERE id = ?`, [b.id]);
    res.json({ booking: await one(`${bookingSelect} WHERE b.id = ?`, [b.id]) });
  }));

  app.post('/api/bookings/:id/cancel', auth(), wrap(async (req, res) => {
    const b = await loadBooking(req, res);
    if (!b) return;
    if (!['pending_payment', 'confirmed'].includes(b.status)) return bad(res, 'This session cannot be cancelled');
    await query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [b.id]);
    let refunded = false;
    if (b.status === 'confirmed') {
      const hoursAhead = (Date.parse(b.startAt) - Date.now()) / 3600000;
      if (req.user.role !== 'student' || hoursAhead >= 2) {
        await query(`UPDATE payments SET status = 'refunded' WHERE booking_id = ? AND status = 'paid'`, [b.id]);
        refunded = true;
      }
    }
    res.json({ ok: true, refunded });
  }));

  app.post('/api/bookings/:id/complete', auth('tutor', 'admin'), wrap(async (req, res) => {
    const b = await loadBooking(req, res);
    if (!b) return;
    if (b.status !== 'confirmed') return bad(res, 'Only confirmed sessions can be completed');
    if (Date.parse(b.startAt) > Date.now()) return bad(res, 'The session has not started yet');
    await query(`UPDATE bookings SET status = 'completed' WHERE id = ?`, [b.id]);
    res.json({ ok: true });
  }));

  app.post('/api/bookings/:id/review', auth('student'), wrap(async (req, res) => {
    const b = await loadBooking(req, res);
    if (!b) return;
    if (b.status !== 'completed') return bad(res, 'You can review a session after it is completed');
    const rating = parseInt(req.body?.rating, 10);
    if (!(rating >= 1 && rating <= 5)) return bad(res, 'Rating must be 1 to 5');
    if (await one(`SELECT id FROM reviews WHERE booking_id = ?`, [b.id])) return bad(res, 'Already reviewed', 409);
    await query(`INSERT INTO reviews (id, booking_id, student_id, tutor_id, student_name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      randomUUID(), b.id, b.studentId, b.tutorId, req.user.name, rating, String(req.body?.comment || '').slice(0, 500), now(),
    ]);
    res.status(201).json({ ok: true });
  }));

  // ---- Payments ----
  app.get('/api/payments', auth(), wrap(async (req, res) => {
    const base = `SELECT p.*, s.name AS student_name, t.name AS tutor_name, b.subject, b.start_at
      FROM payments p JOIN users s ON s.id = p.student_id JOIN users t ON t.id = p.tutor_id JOIN bookings b ON b.id = p.booking_id`;
    const { role, id } = req.user;
    let rows;
    if (role === 'student') rows = await query(`${base} WHERE p.student_id = ? ORDER BY p.created_at DESC`, [id]);
    else if (role === 'tutor') rows = await query(`${base} WHERE p.tutor_id = ? ORDER BY p.created_at DESC`, [id]);
    else rows = await query(`${base} ORDER BY p.created_at DESC LIMIT 500`);
    res.json({ payments: rows });
  }));

  // ---- Progress ----
  app.get('/api/progress', auth(), wrap(async (req, res) => {
    const base = `SELECT g.*, s.name AS student_name, t.name AS tutor_name FROM progress g JOIN users s ON s.id = g.student_id JOIN users t ON t.id = g.tutor_id`;
    const { role, id } = req.user;
    let rows;
    if (role === 'student') rows = await query(`${base} WHERE g.student_id = ? ORDER BY g.created_at DESC`, [id]);
    else if (role === 'tutor') rows = await query(`${base} WHERE g.tutor_id = ? ORDER BY g.created_at DESC`, [id]);
    else rows = await query(`${base} ORDER BY g.created_at DESC LIMIT 500`);
    res.json({ progress: rows });
  }));

  app.post('/api/progress', auth('tutor', 'admin'), wrap(async (req, res) => {
    const { studentId, subject, topic, score, notes } = req.body || {};
    const sc = parseInt(score, 10);
    if (!studentId || !subject?.trim() || !topic?.trim()) return bad(res, 'Student, subject and topic are required');
    if (!(sc >= 0 && sc <= 100)) return bad(res, 'Score must be between 0 and 100');
    await query(`INSERT INTO progress (id, student_id, tutor_id, subject, topic, score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      randomUUID(), studentId, req.user.id, subject.trim(), topic.trim(), sc, String(notes || '').slice(0, 1000), now(),
    ]);
    res.status(201).json({ ok: true });
  }));

  // ---- Messaging ----
  async function canMessage(sender, receiverId) {
    const r = await one(`SELECT * FROM users WHERE id = ? AND status <> 'suspended'`, [receiverId]);
    if (!r || r.id === sender.id) return null;
    return r;
  }

  app.get('/api/messages/contacts', auth(), wrap(async (req, res) => {
    const { role, id } = req.user;
    let contacts;
    if (role === 'student') {
      contacts = await query(`SELECT id, name, role FROM users WHERE role = 'tutor' AND status = 'active' ORDER BY name`);
      contacts.push(...(await query(`SELECT id, name, role FROM users WHERE role = 'admin'`)));
    } else if (role === 'tutor') {
      contacts = await query(`SELECT DISTINCT u.id, u.name, u.role FROM bookings b JOIN users u ON u.id = b.student_id WHERE b.tutor_id = ? ORDER BY u.name`, [id]);
      const extraStudents = await query(`SELECT id, name, role FROM users WHERE role = 'student' LIMIT 10`);
      for (const s of extraStudents) {
        if (!contacts.some((c) => c.id === s.id)) contacts.push(s);
      }
      contacts.push(...(await query(`SELECT id, name, role FROM users WHERE role = 'admin'`)));
    } else {
      contacts = await query(`SELECT id, name, role FROM users WHERE id <> ? AND status <> 'suspended' ORDER BY role, name`, [id]);
    }
    res.json({ contacts });
  }));

  app.get('/api/messages/conversations', auth(), wrap(async (req, res) => {
    const id = req.user.id;
    const msgs = await query(`SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at DESC`, [id, id]);
    const map = new Map();
    for (const m of msgs) {
      const other = m.senderId === id ? m.receiverId : m.senderId;
      if (!map.has(other)) map.set(other, { userId: other, last: m.body, lastAt: m.createdAt, unread: 0 });
      if (m.receiverId === id && !m.readAt) map.get(other).unread += 1;
    }
    const out = [];
    for (const c of map.values()) {
      const u = await one(`SELECT id, name, role FROM users WHERE id = ?`, [c.userId]);
      if (u) out.push({ ...c, name: u.name, role: u.role });
    }
    res.json({ conversations: out, unread: out.reduce((n, c) => n + c.unread, 0) });
  }));

  app.get('/api/messages/:userId', auth(), wrap(async (req, res) => {
    const me = req.user.id;
    const other = req.params.userId;
    const user = await one(`SELECT id, name, role FROM users WHERE id = ?`, [other]);
    if (!user) return bad(res, 'User not found', 404);
    const messages = await query(
      `SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC LIMIT 500`,
      [me, other, other, me]
    );
    await query(`UPDATE messages SET read_at = ? WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`, [now(), other, me]);
    res.json({ user, messages });
  }));

  app.post('/api/messages', auth(), wrap(async (req, res) => {
    const { to, body, subject } = req.body || {};
    const text = String(body || '').trim();
    if (!text) return bad(res, 'Write a message first');
    if (text.length > 2000) return bad(res, 'Message is too long');
    const receiver = await canMessage(req.user, to);
    if (!receiver) return bad(res, 'Recipient not found', 404);
    const id = randomUUID();
    await query(
      `INSERT INTO messages (id, sender_id, receiver_id, subject, body, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, receiver.id, String(subject || 'General Inquiry'), text, now()]
    );
    res.status(201).json({ message: await one(`SELECT * FROM messages WHERE id = ?`, [id]) });
  }));

  // ---- Analytics ----
  app.get('/api/analytics', auth(), wrap(async (req, res) => {
    const { role, id } = req.user;
    const nowISO = now();
    if (role === 'student') {
      const done = await one(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM bookings WHERE student_id = ? AND status = 'completed'`, [id]);
      const up = await one(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM bookings WHERE student_id = ? AND status = 'confirmed' AND end_at > ?`, [id, nowISO]);
      const spent = await one(`SELECT CAST(COALESCE(SUM(amount),0) AS INTEGER) AS n FROM payments WHERE student_id = ? AND status = 'paid'`, [id]);
      const avg = await one(`SELECT AVG(score) AS n FROM progress WHERE student_id = ?`, [id]);
      const series = await query(`SELECT subject, topic, score, created_at FROM progress WHERE student_id = ? ORDER BY created_at ASC`, [id]);
      const bySubject = await query(`SELECT subject, AVG(score) AS avg_score, CAST(COUNT(*) AS INTEGER) AS entries FROM progress WHERE student_id = ? GROUP BY subject ORDER BY subject`, [id]);
      return res.json({ completed: done.n, upcoming: up.n, spent: spent.n, avgScore: avg.n ? Math.round(avg.n) : null, series, bySubject });
    }
    if (role === 'tutor') {
      const done = await one(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM bookings WHERE tutor_id = ? AND status = 'completed'`, [id]);
      const up = await one(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM bookings WHERE tutor_id = ? AND status = 'confirmed' AND end_at > ?`, [id, nowISO]);
      const earned = await one(`SELECT CAST(COALESCE(SUM(amount),0) AS INTEGER) AS n FROM payments WHERE tutor_id = ? AND status = 'paid'`, [id]);
      const students = await one(`SELECT CAST(COUNT(DISTINCT student_id) AS INTEGER) AS n FROM bookings WHERE tutor_id = ? AND status IN ('confirmed','completed')`, [id]);
      const rating = await one(`SELECT AVG(rating) AS n FROM reviews WHERE tutor_id = ?`, [id]);
      const monthly = await query(`SELECT substr(created_at,1,7) AS month, CAST(SUM(amount) AS INTEGER) AS total FROM payments WHERE tutor_id = ? AND status = 'paid' GROUP BY substr(created_at,1,7) ORDER BY month`, [id]);
      return res.json({ completed: done.n, upcoming: up.n, earned: earned.n, students: students.n, rating: rating.n ? Number(rating.n).toFixed(1) : null, monthly });
    }
    const counts = await query(`SELECT role, CAST(COUNT(*) AS INTEGER) AS n FROM users GROUP BY role`);
    const pending = await one(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM users WHERE role = 'tutor' AND status = 'pending'`);
    const byStatus = await query(`SELECT status, CAST(COUNT(*) AS INTEGER) AS n FROM bookings GROUP BY status`);
    const revenue = await one(`SELECT CAST(COALESCE(SUM(amount),0) AS INTEGER) AS n FROM payments WHERE status = 'paid'`);
    const monthly = await query(`SELECT substr(created_at,1,7) AS month, CAST(SUM(amount) AS INTEGER) AS total FROM payments WHERE status = 'paid' GROUP BY substr(created_at,1,7) ORDER BY month`);
    const recent = await query(`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 6`);
    const c = Object.fromEntries(counts.map((r) => [r.role, r.n]));
    res.json({ students: c.student || 0, tutors: c.tutor || 0, pendingTutors: pending.n, byStatus, revenue: revenue.n, monthly, recent });
  }));

  // ---- Admin ----
  app.get('/api/admin/users', auth('admin'), wrap(async (req, res) => {
    const users = await query(`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC`);
    res.json({ users });
  }));

  app.post('/api/admin/users', auth('admin'), wrap(async (req, res) => {
    const { name, email, password, role } = req.body || {};
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return bad(res, 'Name, valid email and an 8+ character password are required');
    if (!['student', 'tutor', 'admin'].includes(role)) return bad(res, 'Invalid role');
    if (await one(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()])) return bad(res, 'That email is already registered', 409);
    const id = randomUUID();
    await query(`INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)`, [
      id, name.trim(), email.toLowerCase(), bcrypt.hashSync(password, 10), role, now(),
    ]);
    if (role === 'tutor') await query(`INSERT INTO tutor_profiles (user_id) VALUES (?)`, [id]);
    res.status(201).json({ ok: true, id });
  }));

  app.patch('/api/admin/users/:id', auth('admin'), wrap(async (req, res) => {
    const { status } = req.body || {};
    if (!['active', 'pending', 'suspended'].includes(status)) return bad(res, 'Invalid status');
    if (req.params.id === req.user.id) return bad(res, 'You cannot change your own status');
    await query(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ ok: true });
  }));

  app.delete('/api/admin/users/:id', auth('admin'), wrap(async (req, res) => {
    const id = req.params.id;
    if (id === req.user.id) return bad(res, 'You cannot delete your own account');
    const used = await one(`SELECT id FROM bookings WHERE student_id = ? OR tutor_id = ?`, [id, id]);
    if (used) return bad(res, 'This user has bookings. Suspend the account instead of deleting it.', 409);
    await query(`DELETE FROM availability WHERE tutor_id = ?`, [id]);
    await query(`DELETE FROM tutor_profiles WHERE user_id = ?`, [id]);
    await query(`DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?`, [id, id]);
    await query(`DELETE FROM users WHERE id = ?`, [id]);
    res.json({ ok: true });
  }));

  // ---- Serve built client in production ----
  const dist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use('/api', (req, res) => bad(res, 'Not found', 404));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  });

  return app;
}
