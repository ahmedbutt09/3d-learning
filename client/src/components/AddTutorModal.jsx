import { useState } from 'react';
import { StudioModal, Alert } from './ui';
import { api } from '../api';
import { Upload, Video, FileText, Check, Plus, Trash2 } from 'lucide-react';

const ALL_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Sciences & Its Principles',
  'Biology (Sciences & Its Principles)',
  'Chemistry (Sciences & Its Principles)',
  'Physics (Sciences & Its Principles)',
  'Biochemistry (Sciences & Its Principles)',
  'History, Geography & Politics',
  'GCSE & AP History',
  'Quran Classes'
];

const SCIENCE_SUBJECTS = [
  'Sciences & Its Principles',
  'Biology (Sciences & Its Principles)',
  'Chemistry (Sciences & Its Principles)',
  'Physics (Sciences & Its Principles)',
  'Biochemistry (Sciences & Its Principles)'
];

const PRESET_FEES = [0, 10, 15, 20, 25, 30, 40, 50];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddTutorModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [primarySubject, setPrimarySubject] = useState('Mathematics');
  const [hourlyRate, setHourlyRate] = useState(25);
  const [selectedSubjects, setSelectedSubjects] = useState(['Mathematics']);
  const [headline, setHeadline] = useState('Experienced Tutor for Elementary, Middle & High School');
  const [topics, setTopics] = useState('Elementary, Middle & High School, Exam Preparation, Free Trial Available');
  const [videoUrl, setVideoUrl] = useState('');
  const [cvFilename, setCvFilename] = useState('');
  const [cvText, setCvText] = useState('');

  // 4 CV summary detail fields
  const [education, setEducation] = useState('Verified Academic Degree & Subject Qualification');
  const [experience, setExperience] = useState('Experienced Tutor at The Third Dimension Learning Institute');
  const [certifications, setCertifications] = useState('Verified 3D Learning Subject Educator');
  const [studyMaterials, setStudyMaterials] = useState('Past papers, structured worksheets, and exam technique guides');

  // 168 slots availability state (7 days x 24 hours, true = open)
  // [dayIndex][hourIndex]
  const [availabilityMatrix, setAvailabilityMatrix] = useState(() => {
    return Array.from({ length: 7 }, () => Array(24).fill(true));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSubject = (s) => {
    if (selectedSubjects.includes(s)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((x) => x !== s));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const selectAllScience = () => {
    const combined = Array.from(new Set([...selectedSubjects, ...SCIENCE_SUBJECTS]));
    setSelectedSubjects(combined);
  };

  const handleOpenAll24 = () => {
    setAvailabilityMatrix(Array.from({ length: 7 }, () => Array(24).fill(true)));
  };

  const handle6AMto11PM = () => {
    setAvailabilityMatrix(
      Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, (_, h) => h >= 6 && h <= 23)
      )
    );
  };

  const handleClearAll = () => {
    setAvailabilityMatrix(Array.from({ length: 7 }, () => Array(24).fill(false)));
  };

  const toggleSlot = (dayIdx, hourIdx) => {
    setAvailabilityMatrix((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[dayIdx][hourIdx] = !copy[dayIdx][hourIdx];
      return copy;
    });
  };

  const countOpenSlots = () => {
    let count = 0;
    for (const day of availabilityMatrix) {
      for (const open of day) {
        if (open) count++;
      }
    }
    return count;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvFilename(file.name);
    // Read text preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCvText(text.slice(0, 3000));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter tutor name and title');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Build availability windows
      const availabilityList = [];
      availabilityMatrix.forEach((daySlots, dayIdx) => {
        // dayIdx 0 = Mon, so in JS Date 0 is Sunday, let's map: 0: Monday (1 in JS), 6: Sunday (0 in JS)
        const jsWeekday = (dayIdx + 1) % 7;
        daySlots.forEach((isOpen, hour) => {
          if (isOpen) {
            availabilityList.push({
              weekday: jsWeekday,
              startMin: hour * 60,
              endMin: (hour + 1) * 60
            });
          }
        });
      });

      const payload = {
        name: name.trim(),
        primarySubject,
        subjects: selectedSubjects.join(', '),
        hourlyRate: Number(hourlyRate),
        headline,
        topics,
        videoUrl,
        cvFilename,
        cvText,
        education,
        experience,
        certifications,
        studyMaterials,
        availability: availabilityList
      };

      const res = await api.post('/tutors', payload);
      if (onCreated) onCreated(res.tutor);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create tutor profile');
    } finally {
      setLoading(false);
    }
  };

  const openCount = countOpenSlots();

  return (
    <StudioModal
      title="Add Tutor Profile, Upload CV & Intro Video"
      subtitle="Website Owner Studio · Local Instant Storage Active (No Firebase Login Required)"
      onClose={onClose}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        <Alert kind="error">{error}</Alert>

        {/* Basic Info Row */}
        <div className="form-grid" style={{ marginBottom: 18 }}>
          <div>
            <label className="field">
              <span>Tutor Full Name & Title *</span>
              <input
                type="text"
                placeholder="e.g., Ustadh / Prof. / Ms. Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          </div>

          <div>
            <label className="field">
              <span>Primary Subject *</span>
              <select
                value={primarySubject}
                onChange={(e) => {
                  setPrimarySubject(e.target.value);
                  if (!selectedSubjects.includes(e.target.value)) {
                    setSelectedSubjects([...selectedSubjects, e.target.value]);
                  }
                }}
              >
                {ALL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="full">
            <div className="row spread" style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--navy)' }}>Custom Lesson Fee ($ USD / Hour - Editable) *</span>
            </div>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                style={{ width: 100 }}
              />
              <span className="muted small">Quick fee:</span>
              <div className="fee-presets">
                {PRESET_FEES.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    className={`fee-btn ${Number(hourlyRate) === amt ? 'selected' : ''}`}
                    onClick={() => setHourlyRate(amt)}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Subjects Taught */}
        <div style={{ background: '#FAF8F4', padding: 16, borderRadius: 10, border: '1px solid var(--line)', marginBottom: 18 }}>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--navy)' }}>
              Additional Subjects Taught by This Tutor (Click to enable easy scheduling)
            </span>
            <button
              type="button"
              className="btn ghost sm"
              onClick={selectAllScience}
              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            >
              + Select All Science Subjects
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_SUBJECTS.map((s) => {
              const isSelected = selectedSubjects.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`fee-btn ${isSelected ? 'selected' : ''}`}
                  style={{ fontSize: '0.82rem' }}
                >
                  {isSelected && <Check size={13} style={{ display: 'inline', marginRight: 4 }} />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Headline & Topics */}
        <div className="form-grid" style={{ marginBottom: 18 }}>
          <div>
            <label className="field">
              <span>Tutor Headline / Bio Tagline</span>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Experienced Tutor for Elementary, Middle & High School"
              />
            </label>
          </div>

          <div>
            <label className="field">
              <span>Topics & Formats Offered (comma-separated)</span>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Elementary, Middle & High School, Exam Preparation, Free Trial"
              />
            </label>
          </div>
        </div>

        {/* Uploads Strip */}
        <div className="grid c3" style={{ marginBottom: 20 }}>
          <div className="card flat" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: 8 }}>1. Tutor Photo</div>
            <label className="btn ghost sm block" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} />
            </label>
          </div>

          <div className="card flat" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: 8 }}>2. Upload CV Document</div>
            <label className="btn ghost sm block" style={{ cursor: 'pointer' }}>
              <FileText size={14} /> {cvFilename || 'Select CV File (PDF/Doc/Img)'}
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="card flat" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: 8 }}>3. Intro Video (Upload or Link)</div>
            <input
              type="text"
              placeholder="Paste video link (https://...)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={{ minHeight: 34, fontSize: '0.84rem' }}
            />
          </div>
        </div>

        {/* Tutor CV Summary Details (4 sections matching screenshot 053006) */}
        <div style={{ marginBottom: 22 }}>
          <div className="eyebrow">Tutor CV Summary Details (Optional if CV File is Uploaded Above)</div>
          <div className="form-grid">
            <div>
              <label className="field">
                <span>01. Education & Qualifications</span>
                <textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="Enter university degrees, diplomas, or qualifications..."
                  rows={2}
                />
              </label>
            </div>

            <div>
              <label className="field">
                <span>02. Teaching Experience</span>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Enter years of tutoring, grade levels taught..."
                  rows={2}
                />
              </label>
            </div>

            <div>
              <label className="field">
                <span>03. Certifications & Special Training</span>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g., Certified Educator, Tajweed & Hifz Certification, GCSE/AP Specialist..."
                  rows={2}
                />
              </label>
            </div>

            <div>
              <label className="field">
                <span>04. Intro Video Description / Study Materials Provided</span>
                <textarea
                  value={studyMaterials}
                  onChange={(e) => setStudyMaterials(e.target.value)}
                  placeholder="e.g., Past papers, structured worksheets, exam techniques..."
                  rows={2}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 168-Hour Weekly Availability Matrix (Matching screenshot 053006) */}
        <div style={{ marginBottom: 20 }}>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <div>
              <div className="eyebrow" style={{ margin: 0 }}>Tutor Weekly Availability Schedule (All 24 Hours × 7 Days Available)</div>
              <p className="muted small" style={{ margin: '2px 0 0' }}>
                All 168 hourly slots are included. Click any slot to toggle open/closed.
              </p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn ghost sm" onClick={handleOpenAll24}>
                Open All 24h × 7 Days (168 Slots)
              </button>
              <button type="button" className="btn ghost sm" onClick={handle6AMto11PM}>
                6 AM – 11 PM (All 7 Days)
              </button>
              <button type="button" className="btn ghost sm" onClick={handleClearAll}>
                Clear All
              </button>
              <span className="badge active" style={{ fontSize: '0.8rem' }}>
                {openCount} / 168 open
              </span>
            </div>
          </div>

          <div className="schedule-table-wrap" style={{ maxHeight: 340 }}>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Time Slot (24h / AM-PM)</th>
                  {DAYS.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 24 }, (_, hour) => {
                  const start = String(hour).padStart(2, '0');
                  const end = String((hour + 1) % 24).padStart(2, '0');
                  const ampm = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
                  const label = `${start}:00 - ${end}:00 (${ampm})`;
                  return (
                    <tr key={hour}>
                      <td>{label}</td>
                      {DAYS.map((_, dayIdx) => {
                        const isOpen = availabilityMatrix[dayIdx][hour];
                        return (
                          <td key={dayIdx}>
                            <button
                              type="button"
                              onClick={() => toggleSlot(dayIdx, hour)}
                              className={`slot-pill-btn ${isOpen ? 'available' : 'locked'}`}
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            >
                              {isOpen ? '✓ OPEN' : 'OFF'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="row spread" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <button type="button" className="btn ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn gold" disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save & Publish Tutor Profile'}
          </button>
        </div>
      </form>
    </StudioModal>
  );
}
