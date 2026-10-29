import { useEffect, useState } from 'react';
import { api } from '../api';
import { CURRICULUM_SUBJECTS } from './SubjectsView';
import { Avatar, Spinner, Empty, Alert } from '../components/ui';
import { Search, Upload, Plus, Play, Calendar, Star, FileText } from 'lucide-react';

export function TutorCardStudio({ tutor, onOpenDetail, onBook }) {
  const ratingVal = tutor.rating ? Number(tutor.rating).toFixed(1) : '5.0';
  const reviewCount = tutor.reviewCount || 0;
  const primarySubject = tutor.subjects?.split(',')[0]?.trim() || 'Mathematics';

  return (
    <div className="tutor-card-studio">
      <div className="tutor-card-header">
        <div className="tutor-avatar-box">
          <FileText size={20} />
          <span style={{ fontSize: '0.74rem', marginTop: 2 }}>CV</span>
        </div>

        <div className="grow">
          <div className="tutor-title-strip">
            <span>{primarySubject}</span>
            <span>· ${tutor.hourlyRate || 25}/hr</span>
            <span>· ★ {ratingVal} ({reviewCount} reviews)</span>
          </div>
          <h3 style={{ margin: '0 0 2px', fontSize: '1.35rem' }}>{tutor.name}</h3>
          <div className="muted small">
            {tutor.headline || `${primarySubject} Tutor at The Third Dimension Learning Institute`}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line-subtle)', paddingTop: 12 }}>
        <div className="tutor-detail-row">
          <strong>Education (CV):</strong> {tutor.education || 'Verified Academic Degree & Subject Qualification'}
        </div>
        <div className="tutor-detail-row">
          <strong>Experience:</strong> {tutor.experience || 'Experienced Tutor at The Third Dimension Learning Institute'}
        </div>
        <div className="tutor-detail-row">
          <strong>Specialties:</strong> {tutor.levels || 'Elementary · Middle & High School · Exam Preparation · Free Trial Lesson Available'}
        </div>
        <div className="tutor-slot-meta" style={{ marginTop: 10 }}>
          <span>• 168 weekly slots open · 0 active locked sessions</span>
        </div>
      </div>

      <div className="row spread" style={{ borderTop: '1px solid var(--line-subtle)', paddingTop: 14, marginTop: 'auto' }}>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => onOpenDetail(tutor)}
        >
          <Play size={14} /> Intro Video & Full CV
        </button>
        <button
          type="button"
          className="btn gold sm"
          onClick={() => onBook(tutor)}
        >
          <Calendar size={14} /> Schedule Class
        </button>
      </div>
    </div>
  );
}

export default function Tutors({
  tutors: propTutors,
  onOpenDetail,
  onBook,
  onOpenAddTutor,
  initialSubject = ''
}) {
  const [tutors, setTutors] = useState(propTutors || null);
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [error, setError] = useState('');

  const loadTutors = () => {
    api.get(`/tutors?q=${encodeURIComponent(q)}&subject=${encodeURIComponent(subject)}`)
      .then((d) => { setTutors(d.tutors); setError(''); })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    const timer = setTimeout(loadTutors, 200);
    return () => clearTimeout(timer);
  }, [q, subject]);

  const handleQuickUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onOpenAddTutor) {
      onOpenAddTutor(file);
    }
  };

  return (
    <div className="container" style={{ padding: '48px 20px 72px' }}>
      <div className="section-head">
        <div className="eyebrow">02. Subject Experts, CVs & Intro Videos</div>
        <h2>3D Learning Tutors & CVs</h2>
        <p>
          Upload tutor CVs (PDF/Doc/Image), photos, and intro videos directly in browser state without needing any external login.
        </p>
      </div>

      {/* Search & Action Bar (Matching Screenshot 052424) */}
      <div className="row spread" style={{ gap: 14, marginBottom: 28 }}>
        <div className="row grow" style={{ gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} />
            <input
              type="search"
              placeholder="Search tutor or subject..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div style={{ flex: '0 0 220px' }}>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {CURRICULUM_SUBJECTS.map((s) => (
                <option key={s.id} value={s.title}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Quick Upload CV File
            <input type="file" onChange={handleQuickUpload} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            className="btn gold sm"
            onClick={() => onOpenAddTutor && onOpenAddTutor()}
          >
            <Plus size={15} /> Add Tutor & Upload CV
          </button>
        </div>
      </div>

      <Alert kind="error">{error}</Alert>

      {!tutors && !error && <Spinner />}

      {tutors && tutors.length === 0 && (
        <Empty>No tutors found matching your search. Try another subject or click "+ Add Tutor & Upload CV" above.</Empty>
      )}

      {tutors && tutors.length > 0 && (
        <div className="grid c2">
          {tutors.map((t) => (
            <TutorCardStudio
              key={t.id}
              tutor={t}
              onOpenDetail={onOpenDetail}
              onBook={onBook}
            />
          ))}
        </div>
      )}
    </div>
  );
}
