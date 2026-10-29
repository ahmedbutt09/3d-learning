import { useEffect, useState } from 'react';
import { api } from '../api';
import { Spinner, Alert, Stars } from '../components/ui';
import { Star, CheckCircle, Send, Award, MessageSquare } from 'lucide-react';

export default function ReviewsView({ tutors = [] }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [tutorId, setTutorId] = useState('');
  const [studentName, setStudentName] = useState('Sarah M. (Parent of Grade 8 Student)');
  const [rating, setRating] = useState(5);
  const [gradeLevel, setGradeLevel] = useState('High School Student · 3D Learning');
  const [outcome, setOutcome] = useState('Exam grade improved from B to A* after live sessions');
  const [comment, setComment] = useState('Satisfied with the structured explanations and dedicated exam preparation.');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    api.get('/reviews')
      .then((d) => setReviews(d.reviews || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
    if (!tutorId && tutors.length > 0) {
      setTutorId(tutors[0].id);
    }
  }, [tutors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tutorId) {
      setError('Please select a tutor');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/reviews', {
        tutorId,
        studentName: studentName.trim(),
        gradeLevel: gradeLevel.trim(),
        outcome: outcome.trim(),
        rating: Number(rating),
        comment: comment.trim()
      });
      setSuccess('Review published successfully!');
      setComment('');
      loadReviews();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '48px 20px 72px' }}>
      <div className="section-head">
        <div className="eyebrow">06. Tutor Quality & Student Testimonials</div>
        <h2>Student Reviews & Ratings — 3D Learning Institute</h2>
        <p>
          Add real student reviews as the website owner or let students submit ratings for your tutors.
        </p>
      </div>

      <Alert kind="error">{error}</Alert>
      <Alert kind="ok">{success}</Alert>

      <div className="reviews-grid">
        {/* Left Column: Reviews Feed (Screenshot 052920) */}
        <div>
          {loading && <Spinner />}

          {!loading && reviews.length === 0 && (
            <div className="card flat center" style={{ padding: '40px 20px', color: 'var(--muted)' }}>
              No reviews published yet. Be the first to add a testimonial!
            </div>
          )}

          {!loading && reviews.map((r) => (
            <div key={r.id} className="review-card-item">
              <div className="row spread" style={{ marginBottom: 6 }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--navy)' }}>
                    {r.studentName || r.student_name || 'Anonymous'}
                  </strong>
                  <span className="muted small"> · {r.gradeLevel || r.grade_level || '3D Learning Curriculum'}</span>
                  {r.tutorName && (
                    <span style={{ color: '#E5A93C', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginTop: 2 }}>
                      for {r.tutorName}
                    </span>
                  )}
                </div>

                <div className="row" style={{ gap: 4, alignItems: 'center' }}>
                  <Stars value={r.rating} />
                  <span className="muted small" style={{ fontWeight: 600 }}>({Number(r.rating).toFixed(1)}/5.0)</span>
                </div>
              </div>

              {r.outcome && (
                <div className="outcome-pill">
                  Outcome: {r.outcome}
                </div>
              )}

              <div className="review-quote">
                “{r.comment || 'Satisfied'}”
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Add Student Review & Rating Form (Screenshot 052920) */}
        <div className="card" style={{ background: '#FFF' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>Add Student Review & Rating</h3>
          <p className="muted small" style={{ marginBottom: 18 }}>
            Publish a student testimonial and star rating immediately on your website.
          </p>

          <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
            <div>
              <label className="field">
                <span>Select Tutor *</span>
                <select value={tutorId} onChange={(e) => setTutorId(e.target.value)} required>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.subjects?.split(',')[0] || 'Tutor'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label className="field">
                <span>Student / Parent Name *</span>
                <input
                  type="text"
                  placeholder="e.g., Sarah M. (or Parent of Grade 8 Student)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <div>
                <label className="field">
                  <span>Star Rating (1–5)</span>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    <option value={5}>★★★★★ (5.0)</option>
                    <option value={4}>★★★★☆ (4.0)</option>
                    <option value={3}>★★★☆☆ (3.0)</option>
                    <option value={2}>★★☆☆☆ (2.0)</option>
                    <option value={1}>★☆☆☆☆ (1.0)</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="field">
                  <span>Grade Level / Course</span>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="High School Student · 3D Learning"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="field">
                <span>Academic Result / Highlight *</span>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Exam grade improved from B to A* after live sessions"
                  required
                />
              </label>
            </div>

            <div>
              <label className="field">
                <span>Student Review Text *</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter the student or parent review..."
                  rows={3}
                  required
                />
              </label>
            </div>

            <button type="submit" className="btn gold block" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Student Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
