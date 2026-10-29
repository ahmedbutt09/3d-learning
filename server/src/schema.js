import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { query, one } from './db.js';

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tutor_profiles (
    user_id TEXT PRIMARY KEY,
    headline TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    subjects TEXT NOT NULL DEFAULT '',
    levels TEXT NOT NULL DEFAULT '',
    hourly_rate INTEGER NOT NULL DEFAULT 25,
    cv_text TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    tz_offset INTEGER NOT NULL DEFAULT 0,
    education TEXT NOT NULL DEFAULT '',
    experience TEXT NOT NULL DEFAULT '',
    certifications TEXT NOT NULL DEFAULT '',
    study_materials TEXT NOT NULL DEFAULT '',
    topics TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    cv_filename TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS availability (
    id TEXT PRIMARY KEY,
    tutor_id TEXT NOT NULL,
    weekday INTEGER NOT NULL,
    start_min INTEGER NOT NULL,
    end_min INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT '',
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    duration_min INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL,
    meeting_url TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 25,
    notes TEXT NOT NULL DEFAULT '',
    custom_time TEXT NOT NULL DEFAULT '',
    payment_method TEXT NOT NULL DEFAULT 'card',
    is_free_trial INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    method TEXT NOT NULL,
    reference TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'General Inquiry',
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    student_id TEXT,
    tutor_id TEXT NOT NULL,
    student_name TEXT NOT NULL DEFAULT 'Anonymous Student',
    grade_level TEXT NOT NULL DEFAULT 'High School Student',
    outcome TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS dispatches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'booking_confirmation',
    created_at TEXT NOT NULL,
    read_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings (tutor_id, start_at)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings (student_id, start_at)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages (sender_id, receiver_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON reviews (tutor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_dispatches_user ON dispatches (user_id)`
];

export async function migrate() {
  for (const sql of DDL) await query(sql);
}

async function createUser({ name, email, password, role, status = 'active' }) {
  const existing = await one(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()]);
  if (existing) return existing.id;
  const id = randomUUID();
  await query(
    `INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email.toLowerCase(), bcrypt.hashSync(password, 10), role, status, new Date().toISOString()]
  );
  return id;
}

export async function seed() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@3dlearning.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  
  let adminId;
  const existingAdmin = await one(`SELECT id FROM users WHERE role = 'admin'`);
  if (!existingAdmin) {
    adminId = await createUser({ name: 'Institute Owner', email: adminEmail, password: adminPassword, role: 'admin' });
    console.log(`Seeded admin account: ${adminEmail}`);
  } else {
    adminId = existingAdmin.id;
  }

  const studentId = await createUser({ name: 'Alex Rivera', email: 'student@3dlearning.com', password: 'Student@12345', role: 'student' });

  const tutorsCount = await one(`SELECT COUNT(*) as count FROM users WHERE role = 'tutor'`);
  if (tutorsCount && tutorsCount.count > 0) return;

  const tutorsData = [
    {
      name: 'Dr. Ayesha Rahman',
      email: 'ayesha@3dlearning.com',
      headline: 'Mathematics & Physics Specialist',
      subjects: 'Mathematics, Sciences & Its Principles, Physics',
      levels: 'Elementary, Middle & High School, GCSE / AP',
      rate: 25,
      bio: 'Over 10 years of classroom and 1-on-1 tutoring experience focusing on foundational mathematics, calculus, and mechanics. Empowers students with exam techniques and past paper mastery.',
      education: 'PhD in Applied Mathematics (Imperial College London), MSc Physics with Distinction',
      experience: '10+ years tutoring GCSE, AP and High School students; former senior examiner for Pearson Edexcel',
      certifications: 'Certified Advanced Subject Educator, GCSE & AP Mathematics Specialist, STEM Mentor',
      studyMaterials: 'Past papers with worked video solutions, topical formula booklets, and timed quiz banks',
      topics: 'Arithmetic & Pre-Algebra, Algebra & Geometry, Trigonometry & Calculus, GCSE / AP Mathematics, Physics & Mechanics',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      rating: 5,
      reviews: [
        {
          studentName: 'Anonymous',
          gradeLevel: 'High School Student · 3D Learning Curriculum',
          outcome: 'Exam grade improved from B to A* after live sessions',
          rating: 5,
          comment: 'Satisfied. The structured explanations and past-paper drills made complex calculus easy to master.'
        },
        {
          studentName: 'Sarah M.',
          gradeLevel: 'GCSE Candidate',
          outcome: 'Score jumped from 62% to 91% in mock examinations',
          rating: 5,
          comment: 'Dr. Ayesha explained algebraic concepts with unbelievable clarity and patience.'
        }
      ]
    },
    {
      name: 'Daniel Foster',
      email: 'daniel@3dlearning.com',
      headline: 'English Language & Academic Writing Coach',
      subjects: 'English Language, History, Geography & Politics, GCSE & AP History',
      levels: 'Elementary, Middle & High School (All Levels)',
      rate: 25,
      bio: 'Patient, structured English language coaching. Specializes in academic vocabulary, grammar mechanics, creative writing, and critical DBQ historical essay analysis.',
      education: 'BA & MA in English Literature & Historical Studies (University of Oxford)',
      experience: '8 years coaching international students in academic English, debating, and AP History essays',
      certifications: 'Cambridge CELTA Certified, Advanced Academic Writing & DBQ Essay Mentor',
      studyMaterials: 'Vocabulary flashcard decks, thesis statement templates, and annotated historical sources',
      topics: 'Grammar & Vocabulary, Spoken English & Fluency, Academic & Creative Writing, Reading Comprehension, World History',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      rating: 5,
      reviews: [
        {
          studentName: 'Parent of Grade 9 Student',
          gradeLevel: 'Middle & High School',
          outcome: 'Developed deep confidence in academic essays and public speaking',
          rating: 5,
          comment: 'Daniel is exceptional. My son went from struggling with essays to getting top marks in English.'
        }
      ]
    },
    {
      name: 'Dr. Imran Qureshi',
      email: 'imran@3dlearning.com',
      headline: 'Biochemistry, Biology & Chemistry Educator',
      subjects: 'Sciences & Its Principles, Biology (Sciences & Its Principles), Chemistry (Sciences & Its Principles), Biochemistry (Sciences & Its Principles)',
      levels: 'Middle & High School / Advanced Exam Prep',
      rate: 25,
      bio: 'PhD life-scientist mentoring students through chemical bonding, stoichiometry, cell biology, genetics, and molecular pathways with clear conceptual mastery.',
      education: 'PhD in Biochemistry & Molecular Biology, PharmD (University of Manchester)',
      experience: '9 years teaching GCSE, A-Level & AP sciences with proven track record of student Grade 9/A* results',
      certifications: 'Royal Society of Chemistry Member, Certified Life Sciences Educator',
      studyMaterials: 'Molecular structure worksheets, 3D reaction pathway diagrams, and past paper mark schemes',
      topics: 'Cell Biology & Genetics, Atomic Structure & Periodic Table, Organic Chemistry, Biochemistry & Enzymes',
      video: '',
      rating: 5,
      reviews: [
        {
          studentName: 'Zayd K.',
          gradeLevel: 'A-Level Chemistry Student',
          outcome: 'Achieved predicted A* in Chemistry and Biology',
          rating: 5,
          comment: 'The 3D model illustrations and visual breakdown of organic reaction mechanisms were game changers.'
        }
      ]
    },
    {
      name: 'Ustadh Bilal Tariq',
      email: 'bilal@3dlearning.com',
      headline: 'Certified Quran, Tajweed & Hifz Educator',
      subjects: 'Quran Classes',
      levels: 'Elementary, Middle & High School (All Ages)',
      rate: 20,
      bio: 'Dedicated educator specializing in Noorani Qaida phonics, proper Makharij articulation, Nazra recitation, and structured Hifz memorization with revision plans.',
      education: 'Ijazah in Hafs an Asim with continuous Sanad, Al-Azhar University Quranic Studies',
      experience: '12 years teaching students worldwide with patience, encouragement, and correct articulation',
      certifications: 'Certified Tajweed Master, Ijazah Holder with Sanad',
      studyMaterials: 'Color-coded Tajweed Mushaf, audio pronunciation guides, and weekly Hifz tracking logs',
      topics: 'Noorani Qaida, Nazra Quran, Tajweed Rules, Hifz (Memorization)',
      video: '',
      rating: 5,
      reviews: [
        {
          studentName: 'Omar H.',
          gradeLevel: 'Elementary & Middle School',
          outcome: 'Completed Noorani Qaida and started fluent Nazra recitation',
          rating: 5,
          comment: 'Ustadh Bilal is so patient with young students. My children look forward to every lesson.'
        }
      ]
    }
  ];

  for (const t of tutorsData) {
    const id = await createUser({ name: t.name, email: t.email, password: 'Tutor@12345', role: 'tutor' });
    await query(
      `INSERT INTO tutor_profiles (
        user_id, headline, bio, subjects, levels, hourly_rate, cv_text, video_url, tz_offset,
        education, experience, certifications, study_materials, topics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        headline=excluded.headline, bio=excluded.bio, subjects=excluded.subjects, levels=excluded.levels,
        hourly_rate=excluded.hourly_rate, cv_text=excluded.cv_text, video_url=excluded.video_url,
        education=excluded.education, experience=excluded.experience, certifications=excluded.certifications,
        study_materials=excluded.study_materials, topics=excluded.topics`,
      [
        id, t.headline, t.bio, t.subjects, t.levels, t.rate,
        `${t.education}\n${t.experience}\n${t.certifications}`, t.video, 0,
        t.education, t.experience, t.certifications, t.studyMaterials, t.topics
      ]
    );

    // Seed all 24 hours x 7 days availability (168 slots total, matching studio screenshots)
    await query(`DELETE FROM availability WHERE tutor_id = ?`, [id]);
    for (let weekday = 0; weekday <= 6; weekday++) {
      await query(
        `INSERT INTO availability (id, tutor_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), id, weekday, 0, 24 * 60]
      );
    }

    // Seed reviews
    if (t.reviews) {
      for (const r of t.reviews) {
        await query(
          `INSERT INTO reviews (id, booking_id, student_id, tutor_id, student_name, grade_level, outcome, rating, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(), null, studentId, id,
            r.studentName, r.gradeLevel, r.outcome, r.rating, r.comment,
            new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000)).toISOString()
          ]
        );
      }
    }
  }

  // Seed sample booking & progress for Alex Rivera
  const firstTutor = await one(`SELECT id, name FROM users WHERE email = 'ayesha@3dlearning.com'`);
  if (firstTutor) {
    const bookingId = randomUUID();
    const startTime = new Date(Date.now() + 24 * 3600000);
    const endTime = new Date(startTime.getTime() + 3600000);

    await query(
      `INSERT INTO bookings (
        id, student_id, tutor_id, subject, topic, start_at, end_at, duration_min, status, meeting_url, price, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 60, 'confirmed', ?, 25, 'Focus on Algebra & Trigonometry exam preparation', ?)`,
      [
        bookingId, studentId, firstTutor.id, 'Mathematics',
        'Mathematics: Live Tutoring & Exam Technique Session',
        startTime.toISOString(), endTime.toISOString(),
        `https://meet.jit.si/3DLearning-${bookingId}`,
        new Date().toISOString()
      ]
    );

    await query(
      `INSERT INTO payments (id, booking_id, student_id, tutor_id, amount, status, method, reference, created_at)
       VALUES (?, ?, ?, ?, 25, 'paid', 'Card ending 4242', 'PAY-3DL-89241', ?)`,
      [randomUUID(), bookingId, studentId, firstTutor.id, new Date().toISOString()]
    );

    await query(
      `INSERT INTO dispatches (id, user_id, title, body, type, created_at)
       VALUES (?, ?, 'Automated Booking Confirmation & Video Classroom Code', 'Your session with Dr. Ayesha Rahman is confirmed for tomorrow. Your private classroom code is 3DLearning-${bookingId}. Invoice receipt PAY-3DL-89241 has been generated.', 'booking_confirmation', ?)`,
      [randomUUID(), studentId, new Date().toISOString()]
    );

    await query(
      `INSERT INTO progress (id, student_id, tutor_id, subject, topic, score, notes, created_at)
       VALUES (?, ?, ?, 'Mathematics', 'Quadratic Equations & Polynomials', 92, 'Excellent conceptual grasp and step-by-step working out.', ?)`,
      [randomUUID(), studentId, firstTutor.id, new Date(Date.now() - 3 * 86400000).toISOString()]
    );

    await query(
      `INSERT INTO messages (id, sender_id, receiver_id, subject, body, created_at)
       VALUES (?, ?, ?, 'Free Trial / Class Inquiry', 'Hello! Looking forward to our session tomorrow. Please have past paper 2025 ready.', ?)`,
      [randomUUID(), firstTutor.id, studentId, new Date(Date.now() - 3600000).toISOString()]
    );
  }

  console.log('Seeded demo curriculum tutors, availability slots, student, bookings, payments, and reviews!');
}
