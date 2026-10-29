import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Spinner, Alert, Badge } from '../components/ui';
import { Video, Calendar, CreditCard, Mail, LineChart, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { fmtDateTime, money, canJoin } from '../lib';

export default function StudentDashboard({ onOpenBookModal }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/bookings').catch(() => ({ bookings: [] })),
      api.get('/payments').catch(() => ({ payments: [] })),
      api.get('/dispatches').catch(() => ({ dispatches: [] })),
      api.get('/progress').catch(() => ({ progress: [] }))
    ])
      .then(([bRes, pRes, dRes, gRes]) => {
        setBookings(bRes.bookings || []);
        setPayments(pRes.payments || []);
        setDispatches(dRes.dispatches || []);
        setProgress(gRes.progress || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled session?')) return;
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setNotice(res.refunded ? 'Session cancelled and payment refunded.' : 'Session cancelled.');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // Metrics
  const upcomingCount = bookings.filter((b) => ['confirmed', 'pending_payment'].includes(b.status)).length;
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const scheduledHours = bookings.reduce((sum, b) => sum + Math.round((Number(b.durationMin) || 60) / 60), 0);
  const avgScore = progress.length > 0 ? Math.round(progress.reduce((sum, p) => sum + Number(p.score || 0), 0) / progress.length) : null;

  return (
    <div className="container" style={{ padding: '48px 20px 72px' }}>
      <div className="section-head">
        <div className="eyebrow">04. Student Academic Portal & Tuition Ledger</div>
        <h2>3D Learning Student Dashboard</h2>
        <p>
          View upcoming lessons, join live video classes, track progress analytics, and inspect payment history.
        </p>
      </div>

      <Alert kind="error">{error}</Alert>
      <Alert kind="ok">{notice}</Alert>

      {/* 4 Metric Cards (Screenshot 052848) */}
      <div className="grid c4" style={{ marginBottom: 36 }}>
        <div className="dash-metric-card">
          <div className="label">Upcoming Live Classes</div>
          <div className="val">{upcomingCount} <span style={{ fontSize: '1.25rem', fontFamily: 'var(--sans)', fontWeight: 600 }}>Sessions</span></div>
          <div className="sub">• Conflict-free locked slots</div>
        </div>

        <div className="dash-metric-card">
          <div className="label">Recorded Mastery Average</div>
          <div className="val">{avgScore !== null ? `${avgScore}%` : '—'}</div>
          <div className="sub">• {progress.length} completed evaluations</div>
        </div>

        <div className="dash-metric-card">
          <div className="label">Total Scheduled Hours</div>
          <div className="val">{scheduledHours} <span style={{ fontSize: '1.25rem', fontFamily: 'var(--sans)', fontWeight: 600 }}>hrs</span></div>
          <div className="sub">Live video instruction</div>
        </div>

        <div className="dash-metric-card">
          <div className="label">Total Tuition Paid</div>
          <div className="val">${totalPaid.toFixed(2)} <span style={{ fontSize: '1.1rem', fontFamily: 'var(--sans)', fontWeight: 600 }}>USD</span></div>
          <div className="sub">{payments.length} itemized invoices</div>
        </div>
      </div>

      {loading && <Spinner />}

      {/* Scheduled Video Classes Section */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="row spread" style={{ marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Scheduled Video Classes & Progress Evaluations</h3>
          <button
            type="button"
            className="btn gold sm"
            onClick={() => onOpenBookModal && onOpenBookModal()}
          >
            <Plus size={15} /> Book New Class
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="empty" style={{ padding: '36px 20px', borderStyle: 'dashed' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--navy)' }}>No scheduled video lessons yet.</p>
            <p className="muted small" style={{ margin: 0 }}>
              Select a tutor in the Tutors & CVs tab to schedule a live class.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 14 }}>
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: '#FAF8F4',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div>
                  <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--navy)' }}>{b.subject}</strong>
                    <Badge status={b.status} />
                    <span className="muted small">· Tutor: {b.tutorName}</span>
                  </div>
                  <div className="muted small">
                    {fmtDateTime(b.startAt)} · {b.durationMin || 60} mins · {money(b.price)}
                    {b.isFreeTrial ? ' (Free Trial)' : ''}
                  </div>
                  {b.topic && (
                    <div style={{ fontSize: '0.84rem', color: '#1B3D64', marginTop: 4 }}>
                      Topic: <em>{b.topic}</em>
                    </div>
                  )}
                </div>

                <div className="row" style={{ gap: 8 }}>
                  <a
                    href={b.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn gold sm"
                  >
                    <Video size={15} /> Join Video Classroom
                  </a>

                  {['confirmed', 'pending_payment'].includes(b.status) && (
                    <button
                      type="button"
                      className="btn danger sm"
                      onClick={() => handleCancelBooking(b.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Integrated Payment History & Automated Dispatches */}
      <div className="grid c2">
        {/* Integrated Payment History & Invoices */}
        <div className="card">
          <div className="row spread" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Integrated Payment History & Invoices</h3>
            <span className="muted small">USD Ledger</span>
          </div>

          {payments.length === 0 ? (
            <div className="muted small center" style={{ padding: '24px 0' }}>
              No tuition transactions recorded yet. Invoices appear automatically upon session booking.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.reference}</td>
                      <td className="muted small">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>${Number(p.amount).toFixed(2)} USD</td>
                      <td>
                        <Badge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Automated Email Dispatches & Real-Time Alerts */}
        <div className="card">
          <div className="row spread" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Automated Email Dispatches & Real-Time Alerts</h3>
            <span style={{ fontSize: '0.8rem', color: '#1F7344', fontWeight: 600 }}>
              • {dispatches.length} alerts
            </span>
          </div>

          {dispatches.length === 0 ? (
            <div className="muted small center" style={{ padding: '24px 0' }}>
              Automated email confirmations and real-time scheduling alerts will appear here as soon as you schedule lessons.
            </div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {dispatches.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#F0F6FC',
                    border: '1px solid #C4D9ED',
                    borderRadius: 8,
                    padding: '12px 14px'
                  }}
                >
                  <div className="row spread" style={{ marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1B3D64', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} /> {d.title}
                    </div>
                    <span className="muted small" style={{ fontSize: '0.74rem' }}>
                      {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#2C496A', lineHeight: 1.4 }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
