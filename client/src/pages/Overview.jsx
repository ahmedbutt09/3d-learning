import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useAuth } from '../auth';
import { canJoin, fmtDate, fmtTime, money } from '../lib';
import { Avatar, Badge, Empty, PageHead, Spinner } from '../components/ui';

const Stat = ({ label, value }) => (
  <div className="card stat"><span className="label">{label}</span><span className="value">{value}</span></div>
);

function UpcomingList({ bookings, role }) {
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && Date.parse(b.endAt) > Date.now()).sort((a, b) => a.startAt.localeCompare(b.startAt)).slice(0, 4);
  if (!upcoming.length) {
    return <Empty>No upcoming sessions. {role === 'student' && <><Link to="/app/tutors">Find a tutor</Link> to book your next lesson.</>}</Empty>;
  }
  return upcoming.map((b) => (
    <div className="card session" key={b.id}>
      <div className="row" style={{ gap: 14 }}>
        <div className="date-block"><b>{new Date(b.startAt).getDate()}</b><span>{new Date(b.startAt).toLocaleString(undefined, { month: 'short' })}</span></div>
        <div>
          <b>{b.subject}</b>
          <div className="muted small">{fmtTime(b.startAt)} · with {role === 'student' ? b.tutorName : b.studentName}</div>
        </div>
      </div>
      {canJoin(b) ? <a className="btn gold sm" href={b.meetingUrl} target="_blank" rel="noreferrer">Join now</a> : <Badge status="confirmed" />}
    </div>
  ));
}

const monthLabel = (m) => { const [y, mo] = m.split('-'); return new Date(Number(y), Number(mo) - 1).toLocaleString(undefined, { month: 'short', year: '2-digit' }); };

export default function Overview() {
  const { user } = useAuth();
  const [a, setA] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/analytics').then(setA).catch(() => setA({}));
    api.get('/bookings').then((d) => setBookings(d.bookings)).catch(() => {});
  }, []);

  if (!a) return <Spinner />;
  const first = user.name.split(' ')[0];

  if (user.role === 'student') {
    return (
      <>
        <PageHead title={`Hello, ${first}`} subtitle="Here is how your learning is going."><Link to="/app/tutors" className="btn gold">Book a session</Link></PageHead>
        <div className="grid c4">
          <Stat label="Upcoming" value={a.upcoming ?? 0} />
          <Stat label="Completed" value={a.completed ?? 0} />
          <Stat label="Average score" value={a.avgScore != null ? `${a.avgScore}%` : '—'} />
          <Stat label="Total spent" value={money(a.spent)} />
        </div>
        <div className="grid c2" style={{ marginTop: 24 }}>
          <div><h3>Next sessions</h3><div><UpcomingList bookings={bookings} role="student" /></div></div>
          <div className="card">
            <h3>Progress over time</h3>
            {a.series?.length ? (
              <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
                <LineChart data={a.series.map((s, i) => ({ n: i + 1, score: s.score, label: `${s.subject}: ${s.topic}` }))}>
                  <CartesianGrid stroke="#eee8db" vertical={false} />
                  <XAxis dataKey="n" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={34} />
                  <Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.label || ''} />
                  <Line type="monotone" dataKey="score" stroke="#b4832f" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart></ResponsiveContainer></div>
            ) : <p className="muted">Scores appear here after your tutor records progress.</p>}
          </div>
        </div>
      </>
    );
  }

  if (user.role === 'tutor') {
    return (
      <>
        <PageHead title={`Welcome, ${first}`} subtitle="Your teaching at a glance."><Link to="/app/profile" className="btn ghost">Edit profile</Link></PageHead>
        <div className="grid c4">
          <Stat label="Upcoming" value={a.upcoming ?? 0} />
          <Stat label="Completed" value={a.completed ?? 0} />
          <Stat label="Students" value={a.students ?? 0} />
          <Stat label="Earnings" value={money(a.earned)} />
        </div>
        <div className="grid c2" style={{ marginTop: 24 }}>
          <div><h3>Next sessions</h3><div><UpcomingList bookings={bookings} role="tutor" /></div></div>
          <div className="card">
            <h3>Monthly earnings {a.rating && <span className="rating" style={{ float: 'right' }}>★ {a.rating}</span>}</h3>
            {a.monthly?.length ? (
              <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.monthly.map((m) => ({ ...m, month: monthLabel(m.month) }))}>
                  <CartesianGrid stroke="#eee8db" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} width={40} />
                  <Tooltip formatter={(v) => money(v)} /><Bar dataKey="total" fill="#0e2238" radius={[6, 6, 0, 0]} />
                </BarChart></ResponsiveContainer></div>
            ) : <p className="muted">Earnings appear here after your first paid booking.</p>}
          </div>
        </div>
      </>
    );
  }

  const statusLabel = { pending_payment: 'Awaiting payment', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
  return (
    <>
      <PageHead title="Institute overview" subtitle="Everything happening across 3D Learning."><Link to="/app/users" className="btn gold">Manage users</Link></PageHead>
      <div className="grid c4">
        <Stat label="Students" value={a.students ?? 0} />
        <Stat label="Tutors" value={a.tutors ?? 0} />
        <Stat label="Pending approvals" value={a.pendingTutors ?? 0} />
        <Stat label="Revenue" value={money(a.revenue)} />
      </div>
      <div className="grid c2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Monthly revenue</h3>
          {a.monthly?.length ? (
            <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.monthly.map((m) => ({ ...m, month: monthLabel(m.month) }))}>
                <CartesianGrid stroke="#eee8db" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip formatter={(v) => money(v)} /><Bar dataKey="total" fill="#b4832f" radius={[6, 6, 0, 0]} />
              </BarChart></ResponsiveContainer></div>
          ) : <p className="muted">No payments yet.</p>}
          <div className="chips" style={{ marginTop: 12 }}>
            {(a.byStatus || []).map((s) => <span className="chip plain" key={s.status}>{statusLabel[s.status] || s.status}: {s.n}</span>)}
          </div>
        </div>
        <div className="card">
          <h3>Recent sign-ups</h3>
          {(a.recent || []).map((u) => (
            <div className="row" key={u.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <Avatar name={u.name} size="sm" />
              <div className="grow"><b>{u.name}</b><div className="muted small">{u.role} · {fmtDate(u.createdAt)}</div></div>
              <Badge status={u.status} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
