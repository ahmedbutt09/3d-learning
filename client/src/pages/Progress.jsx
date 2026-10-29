import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useAuth } from '../auth';
import { fmtDate } from '../lib';
import { Alert, Empty, PageHead, Spinner } from '../components/ui';

function ProgressTable({ rows, who }) {
  if (!rows.length) return <Empty>No progress records yet.</Empty>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Date</th>{who && <th>{who === 'tutor' ? 'Tutor' : 'Student'}</th>}<th>Subject</th><th>Topic</th><th>Score</th><th>Notes</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{fmtDate(r.createdAt)}</td>
              {who && <td>{who === 'tutor' ? r.tutorName : r.studentName}</td>}
              <td>{r.subject}</td><td>{r.topic}</td><td><b>{r.score}%</b></td><td className="muted">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentProgress() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/progress').then((d) => setRows(d.progress)).catch(() => setRows([])); }, []);
  if (!rows) return <Spinner />;
  const chrono = [...rows].reverse();
  const bySubject = Object.values(rows.reduce((acc, r) => {
    acc[r.subject] = acc[r.subject] || { subject: r.subject, total: 0, n: 0 };
    acc[r.subject].total += r.score; acc[r.subject].n += 1;
    return acc;
  }, {})).map((s) => ({ subject: s.subject, average: Math.round(s.total / s.n) }));

  return (
    <>
      <PageHead title="My progress" subtitle="Scores and notes recorded by your tutors." />
      {rows.length > 0 && (
        <div className="grid c2" style={{ marginBottom: 24 }}>
          <div className="card"><h3>Scores over time</h3><div className="chart-box"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={chrono.map((r, i) => ({ n: i + 1, score: r.score, label: `${r.subject}: ${r.topic}` }))}>
              <CartesianGrid stroke="#eee8db" vertical={false} /><XAxis dataKey="n" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} width={34} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.label || ''} />
              <Line type="monotone" dataKey="score" stroke="#b4832f" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart></ResponsiveContainer></div></div>
          <div className="card"><h3>Average by subject</h3><div className="chart-box"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySubject}><CartesianGrid stroke="#eee8db" vertical={false} /><XAxis dataKey="subject" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} width={34} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} /><Bar dataKey="average" fill="#0e2238" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        </div>
      )}
      <ProgressTable rows={rows} who="tutor" />
    </>
  );
}

function TutorProgress() {
  const [rows, setRows] = useState(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: '', subject: '', topic: '', score: '', notes: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(() => api.get('/progress').then((d) => setRows(d.progress)).catch(() => setRows([])), []);
  useEffect(() => { load(); api.get('/tutor/students').then((d) => setStudents(d.students)).catch(() => {}); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post('/progress', form);
      setOk('Progress saved. The student can see it now.');
      setForm({ ...form, topic: '', score: '', notes: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  if (!rows) return <Spinner />;
  return (
    <>
      <PageHead title="Students & progress" subtitle="Record scores and notes after lessons." />
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Add a progress entry</h3>
        {students.length === 0 ? <p className="muted">You will be able to record progress once a student has a confirmed session with you.</p> : (
          <form onSubmit={submit}>
            <Alert>{error}</Alert><Alert kind="ok">{ok}</Alert>
            <div className="form-grid">
              <label className="field"><span>Student</span>
                <select value={form.studentId} onChange={set('studentId')} required>
                  <option value="">Choose…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Subject</span><input value={form.subject} onChange={set('subject')} required /></label>
              <label className="field"><span>Topic</span><input value={form.topic} onChange={set('topic')} required /></label>
              <label className="field"><span>Score (0–100)</span><input type="number" min="0" max="100" value={form.score} onChange={set('score')} required /></label>
              <label className="field full"><span>Notes</span><textarea value={form.notes} onChange={set('notes')} /></label>
            </div>
            <button className="btn" style={{ marginTop: 16 }}>Save entry</button>
          </form>
        )}
      </div>
      <ProgressTable rows={rows} who="student" />
    </>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => { if (user.role === 'admin') api.get('/progress').then((d) => setRows(d.progress)).catch(() => setRows([])); }, [user.role]);
  if (user.role === 'student') return <StudentProgress />;
  if (user.role === 'tutor') return <TutorProgress />;
  if (!rows) return <Spinner />;
  return (<><PageHead title="Progress records" subtitle="All student progress entries." /><ProgressTable rows={rows} who="student" /></>);
}
