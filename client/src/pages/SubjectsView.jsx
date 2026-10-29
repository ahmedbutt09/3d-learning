import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Mail, Instagram, ShieldCheck, GraduationCap, Calendar, Users, Star } from 'lucide-react';

export const CURRICULUM_SUBJECTS = [
  {
    id: 'math',
    title: 'Mathematics',
    trackNumber: '01',
    trackType: 'SUBJECT TRACK',
    description: 'From basics to advanced, master concepts, and exam techniques!',
    subDisciplines: [
      'Arithmetic & Pre-Algebra',
      'Algebra & Geometry',
      'Trigonometry & Calculus',
      'GCSE / AP Mathematics'
    ],
    gradeLevels: 'Elementary, Middle & High School',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Foundational Arithmetic & Algebra · Geometry & Trigonometry · Calculus & Advanced Problem Solving · Exam Techniques & Past Papers',
    defaultFee: 25
  },
  {
    id: 'english',
    title: 'English Language',
    trackNumber: '02',
    trackType: 'SUBJECT TRACK',
    description: 'Grammar, vocabulary, speaking & writing for all levels.',
    subDisciplines: [
      'Grammar & Vocabulary',
      'Spoken English & Fluency',
      'Academic & Creative Writing',
      'Reading Comprehension'
    ],
    gradeLevels: 'Elementary, Middle & High School (All Levels)',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Grammar & Sentence Structure · Academic Vocabulary Building · Fluency & Public Speaking · Creative & Analytical Writing',
    defaultFee: 25
  },
  {
    id: 'sciences',
    title: 'Sciences & Its Principles',
    trackNumber: '03',
    trackType: 'SCIENCE TRACK',
    description: 'Complete Science curriculum covering Biology, Chemistry, Physics & Biochemistry with clear conceptual mastery.',
    subDisciplines: [
      'Biology',
      'Chemistry',
      'Physics',
      'Biochemistry'
    ],
    gradeLevels: 'Elementary, Middle & High School',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Biology & Life Sciences · Chemistry & Molecular Principles · Physics & Mechanics · Biochemistry & Lab Inquiry',
    defaultFee: 25
  },
  {
    id: 'biology',
    title: 'Biology (Sciences & Its Principles)',
    trackNumber: '04',
    trackType: 'SCIENCE TRACK',
    description: 'Cell biology, genetics, human physiology, ecology, and GCSE / AP Biology exam preparation.',
    subDisciplines: [
      'Cell Biology & Microscopy',
      'Genetics & DNA',
      'Human Physiology',
      'Ecology & Past Papers'
    ],
    gradeLevels: 'Elementary, Middle & High School',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Cell Biology & Microscopy · Genetics & Molecular Biology · Human Anatomy & Physiology · Ecology & Past Paper Practice',
    defaultFee: 25
  },
  {
    id: 'chemistry',
    title: 'Chemistry (Sciences & Its Principles)',
    trackNumber: '05',
    trackType: 'SCIENCE TRACK',
    description: 'Atomic structure, periodic table, chemical bonding, stoichiometry, organic & inorganic chemistry.',
    subDisciplines: [
      'Atomic Structure',
      'Chemical Bonding',
      'Stoichiometry',
      'Organic Chemistry'
    ],
    gradeLevels: 'Elementary, Middle & High School',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Atomic Structure & Periodic Table · Chemical Bonding & Reactions · Stoichiometry & Quantitative Chemistry · Organic & Analytical Chemistry',
    defaultFee: 25
  },
  {
    id: 'physics',
    title: 'Physics (Sciences & Its Principles)',
    trackNumber: '06',
    trackType: 'SCIENCE TRACK',
    description: 'Mechanics, forces, energy, electricity & magnetism, waves, and mathematical physics problem solving.',
    subDisciplines: [
      'Classical Mechanics',
      'Electricity & Circuits',
      'Waves & Optics',
      'Past Paper Exam Prep'
    ],
    gradeLevels: 'Elementary, Middle & High School',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Classical Mechanics & Kinematics · Electricity, Circuits & Magnetism · Waves, Optics & Thermodynamics · GCSE / AP Physics Past Papers',
    defaultFee: 25
  },
  {
    id: 'biochemistry',
    title: 'Biochemistry (Sciences & Its Principles)',
    trackNumber: '07',
    trackType: 'SCIENCE TRACK',
    description: 'Biomolecules, enzymes, cellular metabolism, molecular pathways, and advanced life-science principles.',
    subDisciplines: [
      'Proteins & Lipids',
      'Enzyme Kinetics',
      'Cellular Metabolism',
      'Lab Inquiry'
    ],
    gradeLevels: 'Middle & High School / Advanced Exam Prep',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Proteins, Carbohydrates & Lipids · Enzyme Kinetics & Metabolism · Nucleic Acids & Molecular Pathways · Lab Principles & Exam Questions',
    defaultFee: 25
  },
  {
    id: 'history',
    title: 'History, Geography & Politics',
    trackNumber: '08',
    trackType: 'SUBJECT TRACK',
    description: 'Understand global politics, History and geography through clear explanations!',
    subDisciplines: [
      'World History',
      'Geography',
      'Global Politics & Civics'
    ],
    gradeLevels: 'Elementary, Middle & High School',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'World History & Civilizations · Human & Physical Geography · Global Politics & Civics · Critical Source Analysis',
    defaultFee: 25
  },
  {
    id: 'gcse-history',
    title: 'GCSE & AP History',
    trackNumber: '09',
    trackType: 'SUBJECT TRACK',
    description: 'Higher examination preparations, including past papers, worksheets and discussions',
    subDisciplines: [
      'Timed Past Papers',
      'DBQ Essays',
      'Seminar Revision'
    ],
    gradeLevels: 'High School & GCSE / AP Exam Candidates',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Timed Past Papers Practice · Structured Revision Worksheets · Document-Based Question (DBQ) Essays · Seminar Discussions & Exam Rubrics',
    defaultFee: 25
  },
  {
    id: 'quran',
    title: 'Quran Classes',
    trackNumber: '010',
    trackType: 'SUBJECT TRACK',
    description: 'Qaida, Nazra, Tajweed, Hifz',
    subDisciplines: [
      'Noorani Qaida',
      'Nazra Quran',
      'Tajweed Rules',
      'Hifz (Memorization)'
    ],
    gradeLevels: 'Elementary, Middle & High School (All Ages)',
    classFormat: 'Small Groups or Private 1-on-1 Sessions',
    keyFocus: 'Noorani Qaida Phonics · Proper Makharij & Tajweed Rules · Fluent Nazra Quran Recitation · Guided Hifz & Retention Revision',
    defaultFee: 20
  }
];

export default function SubjectsView({ tutors = [], onScheduleSubject, onFilterSubject }) {
  const nav = useNavigate();

  // Helper to count tutors matching a subject
  const getMatchedCount = (subjectTitle) => {
    return tutors.filter((t) => {
      const s = (t.subjects || '').toLowerCase();
      const target = subjectTitle.toLowerCase().split('(')[0].trim();
      return s.includes(target) || s.includes('sciences') || s.includes('math');
    }).length || 1;
  };

  return (
    <>
      {/* Hero Banner (Screenshot 052200) */}
      <section className="hero-banner">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow" style={{ color: '#E5A93C' }}>
              3D LEARNING · ONLINE TUTORING HUB
            </div>
            <h1>The Third Dimension Learning Institute</h1>
            <ul className="hero-checklist">
              <li>
                <Check size={20} /> For Elementary, Middle & High School Students
              </li>
              <li>
                <Check size={20} /> Live Classes with Experienced Tutors
              </li>
              <li>
                <Check size={20} /> Small Groups or Private Sessions
              </li>
            </ul>

            <div className="row" style={{ gap: 14 }}>
              <button
                type="button"
                className="btn gold"
                onClick={() => {
                  const firstTutor = tutors[0];
                  if (firstTutor && onScheduleSubject) {
                    onScheduleSubject(firstTutor, 'Mathematics');
                  } else {
                    nav('/tutors');
                  }
                }}
              >
                REGISTER NOW · View Tutors & Book Free Trial
              </button>
            </div>
          </div>

          <div>
            <div className="hero-side-card">
              <div className="hero-crest">
                <GraduationCap size={36} />
              </div>
              <h3>FREE TRIAL LESSON</h3>
              <p>
                Experience live 1-on-1 or small-group learning with our experienced tutors across Elementary, Middle & High School subjects.
              </p>
              <button
                type="button"
                className="btn gold block"
                onClick={() => {
                  const firstTutor = tutors[0];
                  if (firstTutor && onScheduleSubject) {
                    onScheduleSubject(firstTutor, 'Mathematics');
                  } else {
                    window.location.href = 'mailto:3dlearninginstitute@gmail.com?subject=Free Trial Lesson Inquiry';
                  }
                }}
              >
                Request Free Trial via Email
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 01. Official Curriculum Section (Screenshots 052237, 052254, 052320) */}
      <section className="section">
        <div className="container">
          <div className="row spread" style={{ alignItems: 'flex-end', marginBottom: 32 }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div className="eyebrow">01. Official Curriculum - Elementary, Middle & High School</div>
              <h2>Subjects We Offer at 3D Learning Institute</h2>
              <p>
                Live classes with experienced tutors in small groups or private sessions. Every new student is eligible for a Free Trial Lesson.
              </p>
            </div>
            <div>
              <Link to="/tutors" className="btn ghost sm">
                View Tutors ({tutors.length || 4})
              </Link>
            </div>
          </div>

          <div className="grid c3">
            {CURRICULUM_SUBJECTS.map((subj) => {
              const matched = getMatchedCount(subj.title);
              return (
                <div key={subj.id} className="subject-card">
                  <div className="subject-badge-strip">
                    <span>{subj.trackNumber}. {subj.trackType}</span>
                    <span>• FREE TRIAL • ${subj.defaultFee}/LESSON</span>
                  </div>

                  <div className="subject-bar">
                    <div className="subject-indicator" />
                    <h3>{subj.title}</h3>
                  </div>

                  <p className="muted small" style={{ minHeight: 40, margin: '6px 0 12px' }}>
                    {subj.description}
                  </p>

                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
                    Quick Select Sub-Discipline:
                  </div>
                  <div className="sub-discipline-pills">
                    {subj.subDisciplines.map((pill) => (
                      <span
                        key={pill}
                        className="sub-pill"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (onFilterSubject) onFilterSubject(subj.title);
                          nav('/tutors');
                        }}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>

                  <div className="subject-spec-list">
                    <div><strong>Grade Levels:</strong> {subj.gradeLevels}</div>
                    <div style={{ margin: '4px 0' }}><strong>Class Format:</strong> {subj.classFormat}</div>
                    <div><strong>Key Focus:</strong> {subj.keyFocus}</div>
                  </div>

                  <div className="subject-card-footer">
                    <span className="muted small">{matched} {matched === 1 ? 'tutor' : 'tutors'} matched</span>
                    <div className="row" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => {
                          if (onFilterSubject) onFilterSubject(subj.title);
                          nav('/tutors');
                        }}
                      >
                        View Tutors
                      </button>
                      <button
                        type="button"
                        className="btn gold sm"
                        onClick={() => {
                          // Find matching tutor or first tutor
                          const matchingTutor = tutors.find((t) =>
                            (t.subjects || '').toLowerCase().includes(subj.title.toLowerCase().split('(')[0].trim())
                          ) || tutors[0];
                          if (matchingTutor && onScheduleSubject) {
                            onScheduleSubject(matchingTutor, subj.title);
                          }
                        }}
                      >
                        Schedule {subj.title.split('(')[0].trim()}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
