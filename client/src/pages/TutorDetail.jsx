import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { dayKey, fmtDate, fmtTime, money, toEmbed } from '../lib';
import { Alert, Avatar, Spinner } from '../components/ui';
import PayModal from '../components/PayModal';

export default function TutorDetail({ base = '/tutors' }) {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booking, setBooking] = useState(null);

  const loadSlots = () => api.get(`/tutors/${id}/slots`).then((d) => setSlots(d.slots)).catch(() => {});

  useEffect(() => {
    api.get(`/tutors/${id}`).then((d) => { setData(d); setSubject(d.tutor.subjects.split(',')[0]?.trim() || ''); }).catch((e) => setError(e.message));
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const days = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      const k = dayKey(s);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    }
    return [...map.entries()];
  }, [slots]);

  if (error && !data) return <div className="container" style={{ padding: '60px 20px' }}><Alert>{error}</Alert><Link to={base}>Back to tutors</Link></div>;
  if (!data) return <Spinner />;
  const { tutor: t, reviews } = data;
  const embed = toEmbed(t.videoUrl);
  const subjects = t.subjects.split(',').map((s) => s.trim()).filter(Boolean);

  const book = async () => {
    if (!user) return nav('/login/student');
    setError('');
    setBusy(true);
    try {
      const d = await api.post('/bookings', { tutorId: t.id, startAt: slot, subject, notes });
      setBooking(d.booking);
    } catch (err) {
      setError(err.message);
      loadSlots();
      setSlot('');
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <div className="detail-grid">
      <div className="stack">
        <div className="row" style={{ gap: 20 }}>
          <Avatar name={t.name} size="lg" />
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Tutor</div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', margin: 0 }}>{t.name}</h1>
            <div className="muted">{t.headline}</div>
            {t.reviewCount > 0 && <span className="rating"><Star size={15} fill="currentColor" /> {Number(t.rating).toFixed(1)} ({t.reviewCount} reviews)</span>}
          </div>
        </div>
        <div className="chips">
          {subjects.map((s) => <span className="chip" key={s}>{s}</span>)}
          {t.levels.split(',').map((s) => s.trim()).filter(Boolean).map((s) => <span className="chip plain" key={s}>{s}</span>)}
        </div>

        {embed ? (
          <div className="video"><iframe src={embed} title={`${t.name} introduction`} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div>
        ) : t.videoUrl ? (
          <a className="btn ghost" href={t.videoUrl} target="_blank" rel="noreferrer">Watch intro video</a>
        ) : null}

        <div className="card flat"><h3>About</h3><p style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{t.bio || 'This tutor has not added a biography yet.'}</p></div>
        {t.cvText && <div className="card flat"><h3>Curriculum vitae</h3><pre className="cv">{t.cvText}</pre></div>}

        <div className="card flat">
          <h3>Reviews</h3>
          {reviews.length === 0 && <p className="muted" style={{ marginBottom: 0 }}>No reviews yet.</p>}
          {reviews.map((r, i) => (
            <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 0 }}>
              <span className="rating">{'★'.repeat(r.rating)}<span style={{ color: '#d5ccb6' }}>{'★'.repeat(5 - r.rating)}</span></span>
              <span className="muted small"> · {r.studentName.split(' ')[0]}</span>
              {r.comment && <p style={{ margin: '4px 0 0' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      <aside className="card sticky-panel">
        <div className="row spread">
          <h3 style={{ margin: 0 }}>Book a session</h3>
          <b style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem' }}>{money(t.hourlyRate)}<span className="muted small"> / hr</span></b>
        </div>
        <p className="muted small">60-minute video lesson. Times shown in your local time.</p>
        <Alert>{error}</Alert>
        {user && user.role !== 'student' ? (
          <Alert kind="info">Only student accounts can book sessions.</Alert>
        ) : (
          <>
            {days.length === 0 && <p className="muted">No open slots in the next 14 days. Send the tutor a message instead.</p>}
            {days.slice(0, 7).map(([k, list]) => (
              <div className="slot-day" key={k}>
                <h4>{fmtDate(list[0])}</h4>
                <div className="slots">
                  {list.map((s) => (
                    <button type="button" key={s} className={`slot ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>{fmtTime(s)}</button>
                  ))}
                </div>
              </div>
            ))}
            {slot && (
              <div className="stack" style={{ marginTop: 14 }}>
                {subjects.length > 1 && (
                  <label className="field"><span>Subject</span>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((s) => <option key={s}>{s}</option>)}</select>
                  </label>
                )}
                <label className="field"><span>Notes for the tutor (optional)</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
                </label>
              </div>
            )}
            <button className="btn gold block" style={{ marginTop: 16 }} disabled={(!slot && !!user) || busy} onClick={book}>
              {busy ? 'Reserving…' : user ? 'Continue to payment' : 'Sign in to book'}
            </button>
          </>
        )}
        {user && user.role === 'student' && (
          <Link className="btn ghost block" style={{ marginTop: 10 }} to={`/app/messages?to=${t.id}`}><MessageSquare size={16} /> Message {t.name.split(' ')[0]}</Link>
        )}
      </aside>

      {booking && (
        <PayModal
          booking={booking}
          onClose={() => { setBooking(null); setSlot(''); loadSlots(); }}
          onPaid={() => nav('/app/sessions')}
        />
      )}
    </div>
  );

  return base === '/tutors' ? <div className="container" style={{ padding: '40px 20px 72px' }}>{body}</div> : body;
}
