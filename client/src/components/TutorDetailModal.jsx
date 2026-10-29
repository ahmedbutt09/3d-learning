import { useState } from 'react';
import { StudioModal, Stars } from './ui';
import { Calendar, Play, FileText, Clock, Star, ExternalLink } from 'lucide-react';
import { toEmbed } from '../lib';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  const start = String(i).padStart(2, '0');
  const end = String((i + 1) % 24).padStart(2, '0');
  const ampm = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
  return `${start}:00 - ${end}:00 (${ampm})`;
});

export default function TutorDetailModal({ tutor, reviews = [], onClose, onBook }) {
  const [activeTab, setActiveTab] = useState('cv'); // 'cv' | 'video' | 'availability' | 'reviews'

  const embedUrl = toEmbed(tutor.videoUrl);
  const tutorReviews = reviews.filter((r) => r.tutorId === tutor.id || r.tutor_id === tutor.id);
  const reviewCount = tutorReviews.length || tutor.reviewCount || 0;
  const ratingVal = tutor.rating ? Number(tutor.rating).toFixed(1) : '5.0';

  return (
    <StudioModal
      title={tutor.name}
      subtitle={`${tutor.subjects || 'General'} · $${tutor.hourlyRate || 25}/hr · ★ ${ratingVal} (${reviewCount} reviews)`}
      onClose={onClose}
      size="large"
    >
      <div>
        {/* Top Header Strip with Tabs & Book Button */}
        <div className="row spread" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 20 }}>
          <div className="row" style={{ gap: 6 }}>
            <button
              type="button"
              className={`fee-btn ${activeTab === 'cv' ? 'selected' : ''}`}
              onClick={() => setActiveTab('cv')}
            >
              Curriculum Vitae (CV)
            </button>
            <button
              type="button"
              className={`fee-btn ${activeTab === 'video' ? 'selected' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              Intro Video & Syllabus
            </button>
            <button
              type="button"
              className={`fee-btn ${activeTab === 'availability' ? 'selected' : ''}`}
              onClick={() => setActiveTab('availability')}
            >
              Weekly Availability (168 slots)
            </button>
            <button
              type="button"
              className={`fee-btn ${activeTab === 'reviews' ? 'selected' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Student Reviews ({reviewCount})
            </button>
          </div>

          <button
            type="button"
            className="btn gold sm"
            onClick={() => {
              onClose();
              if (onBook) onBook(tutor);
            }}
          >
            <Calendar size={15} /> Book 1-on-1 Session
          </button>
        </div>

        {/* Tab 1: Curriculum Vitae (CV) */}
        {activeTab === 'cv' && (
          <div className="stack" style={{ gap: 20 }}>
            <div style={{ background: '#FAF8F4', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--line)' }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Specialties & Class Formats</div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {tutor.levels || 'Elementary · Middle & High School · Exam Preparation · Free Trial Lesson Available'}
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>
                {tutor.bio || tutor.headline || 'Experienced subject specialist at The Third Dimension Learning Institute.'}
              </div>
            </div>

            <div className="grid c2">
              <div className="card flat">
                <h4 style={{ color: 'var(--navy)', marginBottom: 8 }}>01. Academic Degrees & Education</h4>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', whiteSpace: 'pre-line' }}>
                  {tutor.education || 'Verified Academic Degree & Subject Qualification from accredited institution.'}
                </p>
              </div>

              <div className="card flat">
                <h4 style={{ color: 'var(--navy)', marginBottom: 8 }}>02. Teaching Experience</h4>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', whiteSpace: 'pre-line' }}>
                  {tutor.experience || 'Experienced Educator at The Third Dimension Learning Institute with proven student performance.'}
                </p>
              </div>

              <div className="card flat">
                <h4 style={{ color: 'var(--navy)', marginBottom: 8 }}>03. Certifications & Special Training</h4>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', whiteSpace: 'pre-line' }}>
                  {tutor.certifications || 'Verified 3D Learning Subject Educator & Exam Technique Specialist.'}
                </p>
              </div>

              <div className="card flat">
                <h4 style={{ color: 'var(--navy)', marginBottom: 8 }}>04. Study Materials & Exam Prep</h4>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', whiteSpace: 'pre-line' }}>
                  {tutor.studyMaterials || 'Past papers, structured worksheets, worked video solutions and exam technique guides.'}
                </p>
              </div>
            </div>

            {tutor.cvText && (
              <div className="card flat">
                <h4 style={{ color: 'var(--navy)', marginBottom: 8 }}>Uploaded CV Document Transcript</h4>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {tutor.cvText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Intro Video & Syllabus */}
        {activeTab === 'video' && (
          <div className="stack" style={{ gap: 20 }}>
            <div style={{ background: '#091724', borderRadius: 12, overflow: 'hidden', padding: 24, textAlign: 'center', color: '#FFF' }}>
              {embedUrl ? (
                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden' }}>
                  <iframe
                    src={embedUrl}
                    title={`${tutor.name} introduction`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : tutor.videoUrl ? (
                <div style={{ padding: '30px 20px' }}>
                  <Play size={48} style={{ color: '#E5A93C', margin: '0 auto 16px' }} />
                  <h3 style={{ color: '#FFF', margin: '0 0 8px' }}>{tutor.name} — Subject Introduction</h3>
                  <p style={{ color: '#A0B2C4', fontSize: '0.88rem', marginBottom: 20 }}>
                    Video link: {tutor.videoUrl}
                  </p>
                  <a
                    href={tutor.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn gold"
                    style={{ display: 'inline-flex', gap: 6 }}
                  >
                    <ExternalLink size={16} /> Open Video Link
                  </a>
                </div>
              ) : (
                <div style={{ padding: '40px 20px' }}>
                  <Play size={48} style={{ color: '#E5A93C', margin: '0 auto 16px' }} />
                  <h3 style={{ color: '#FFF', margin: '0 0 8px' }}>{tutor.name} — Live Class Preview</h3>
                  <p style={{ color: '#A0B2C4', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto' }}>
                    Intro video recording and course breakdown available during live trial session.
                  </p>
                </div>
              )}
            </div>

            <div className="card flat">
              <h4 style={{ color: 'var(--navy)', marginBottom: 8 }}>Teaching Approach & Video Summary</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {tutor.bio || 'Live classes for Elementary, Middle & High School students with small groups or private sessions. Structured problem sets and personalized pace.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Weekly Availability (168 slots) */}
        {activeTab === 'availability' && (
          <div>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <div className="muted small">
                Recurring weekly schedule for <strong>{tutor.name}</strong>. Overlapping bookings are automatically locked.
              </div>
              <div className="row" style={{ gap: 14, fontSize: '0.82rem' }}>
                <span style={{ color: '#1F7344', fontWeight: 600 }}>• AVAILABLE SLOT</span>
                <span style={{ color: 'var(--muted)' }}>○ OFF DUTY</span>
              </div>
            </div>

            <div className="schedule-table-wrap">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Time Window</th>
                    {DAYS.map((d) => (
                      <th key={d}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS_24.map((timeLabel, hourIdx) => (
                    <tr key={timeLabel}>
                      <td>{timeLabel}</td>
                      {DAYS.map((_, dayIdx) => (
                        <td key={dayIdx}>
                          <span className="slot-pill-btn available" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                            • OPEN
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Student Reviews */}
        {activeTab === 'reviews' && (
          <div>
            {tutorReviews.length === 0 ? (
              <div className="card flat center" style={{ padding: '36px 20px', color: 'var(--muted)' }}>
                No student reviews submitted yet for {tutor.name}.
              </div>
            ) : (
              <div className="stack" style={{ gap: 14 }}>
                {tutorReviews.map((r, i) => (
                  <div key={i} className="review-card-item">
                    <div className="row spread" style={{ marginBottom: 6 }}>
                      <div>
                        <strong>{r.studentName || r.student_name || 'Anonymous Student'}</strong>
                        <span className="muted small"> · {r.gradeLevel || r.grade_level || '3D Learning Student'}</span>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.outcome && (
                      <div className="outcome-pill">
                        Outcome: {r.outcome}
                      </div>
                    )}
                    <div className="review-quote">
                      “{r.comment || 'Satisfied with the lessons and clear explanations.'}”
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </StudioModal>
  );
}
