import { useCallback, useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { canJoin, fmtDateTime, money } from '../lib';
import { Alert, Badge, Empty, Modal, PageHead, Spinner, Stars } from '../components/ui';
import PayModal from '../components/PayModal';

function ReviewModal({ booking, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/bookings/${booking.id}/review`, { rating, comment });
      onDone();
    } catch (err) { setError(err.message); }
  };
  return (
    <Modal title={`Review ${booking.tutorName}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Alert>{error}</Alert>
        <Stars value={rating} onChange={setRating} />
        <label className="field"><span>Comment (optional)</span><textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} /></label>
        <button className="btn block">Submit review</button>
      </form>
    </Modal>
  );
}

export default function Sessions() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pay, setPay] = useState(null);
  const [review, setReview] = useState(null);

  const load = useCallback(() => api.get('/bookings').then((d) => setList(d.bookings)).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const act = async (b, action) => {
    setError(''); setNotice('');
    if (action === 'cancel' && !window.confirm('Cancel this session?')) return;
    try {
      const d = await api.post(`/bookings/${b.id}/${action}`);
      if (action === 'cancel') setNotice(d.refunded ? 'Session cancelled and your payment was refunded.' : 'Session cancelled.');
      load();
    } catch (err) { setError(err.message); }
  };

  if (!list) return <Spinner />;
  const nowMs = Date.now();
  const isUpcoming = (b) => ['confirmed', 'pending_payment'].includes(b.status) && Date.parse(b.endAt) > nowMs;
  const shown = list.filter((b) => (tab === 'all' ? true : tab === 'upcoming' ? isUpcoming(b) : !isUpcoming(b)));
  if (tab === 'upcoming') shown.sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <>
      <PageHead title={user.role === 'admin' ? 'All sessions' : 'Sessions'} subtitle="Join, pay, cancel or review your lessons." />
      <div className="tabs" style={{ maxWidth: 380 }}>
        {[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <Alert>{error}</Alert>
      <Alert kind="ok">{notice}</Alert>
      {shown.length === 0 && <Empty>Nothing here yet.</Empty>}
      {shown.map((b) => (
        <div className="card session" key={b.id}>
          <div className="row" style={{ gap: 14 }}>
            <div className="date-block"><b>{new Date(b.startAt).getDate()}</b><span>{new Date(b.startAt).toLocaleString(undefined, { month: 'short' })}</span></div>
            <div>
              <b>{b.subject}</b> <Badge status={b.status} />
              <div className="muted small">{fmtDateTime(b.startAt)} · {user.role === 'student' ? `Tutor: ${b.tutorName}` : user.role === 'tutor' ? `Student: ${b.studentName}` : `${b.studentName} with ${b.tutorName}`} · {money(b.price)}</div>
              {b.notes && <div className="small" style={{ marginTop: 4 }}>“{b.notes}”</div>}
            </div>
          </div>
          <div className="actions">
            {b.status === 'pending_payment' && user.role === 'student' && <button className="btn gold sm" onClick={() => setPay(b)}>Pay now</button>}
            {canJoin(b) && <a className="btn sm" href={b.meetingUrl} target="_blank" rel="noreferrer"><Video size={15} /> Join video</a>}
            {b.status === 'confirmed' && !canJoin(b) && Date.parse(b.endAt) > nowMs && <span className="muted small" style={{ alignSelf: 'center' }}>Video opens 15 min before</span>}
            {user.role !== 'student' && b.status === 'confirmed' && Date.parse(b.startAt) <= nowMs && <button className="btn ghost sm" onClick={() => act(b, 'complete')}>Mark completed</button>}
            {user.role === 'student' && b.status === 'completed' && !b.rating && <button className="btn ghost sm" onClick={() => setReview(b)}>Leave review</button>}
            {['pending_payment', 'confirmed'].includes(b.status) && Date.parse(b.endAt) > nowMs && <button className="btn danger sm" onClick={() => act(b, 'cancel')}>Cancel</button>}
          </div>
        </div>
      ))}
      {pay && <PayModal booking={pay} onClose={() => setPay(null)} onPaid={() => { setPay(null); setNotice('Payment received. Your session is confirmed.'); load(); }} />}
      {review && <ReviewModal booking={review} onClose={() => setReview(null)} onDone={() => { setReview(null); load(); }} />}
    </>
  );
}
