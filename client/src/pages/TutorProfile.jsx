import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { DAYS, OFFSETS, deviceOffset, minToTime, offsetLabel, timeToMin } from '../lib';
import { Alert, PageHead, Spinner } from '../components/ui';

export default function TutorProfile() {
  const [form, setForm] = useState(null);
  const [windows, setWindows] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/tutor/profile').then(({ profile: p, availability }) => {
      const fresh = !p.headline && !p.bio && Number(p.tzOffset) === 0;
      setForm({
        name: p.name, headline: p.headline, bio: p.bio, subjects: p.subjects, levels: p.levels, hourlyRate: p.hourlyRate,
        cvText: p.cvText, videoUrl: p.videoUrl, tzOffset: fresh ? deviceOffset() : Number(p.tzOffset),
      });
      setWindows(availability.map((a) => ({ weekday: a.weekday, start: minToTime(a.startMin), end: minToTime(a.endMin) })));
    }).catch((e) => setError(e.message));
  }, []);

  if (!form) return error ? <Alert>{error}</Alert> : <Spinner />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setWin = (i, k, v) => setWindows(windows.map((w, j) => (j === i ? { ...w, [k]: v } : w)));
  const offsets = [...new Set([...OFFSETS, Number(form.tzOffset)])].sort((a, b) => a - b);

  const save = async (e) => {
    e.preventDefault();
    setError(''); setOk(''); setBusy(true);
    try {
      await api.put('/tutor/profile', form);
      await api.put('/tutor/availability', {
        availability: windows.map((w) => ({ weekday: Number(w.weekday), startMin: timeToMin(w.start), endMin: timeToMin(w.end) })),
      });
      setOk('Profile and availability saved.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Profile & availability" subtitle="This is what students see before they book you." />
      <form onSubmit={save} className="stack">
        <Alert>{error}</Alert><Alert kind="ok">{ok}</Alert>
        <div className="card">
          <h3>Public profile</h3>
          <div className="form-grid">
            <label className="field"><span>Display name</span><input value={form.name} onChange={set('name')} required /></label>
            <label className="field"><span>Headline</span><input value={form.headline} onChange={set('headline')} placeholder="e.g. Physics & Maths specialist" /></label>
            <label className="field"><span>Subjects (comma separated)</span><input value={form.subjects} onChange={set('subjects')} placeholder="Physics, Mathematics" /></label>
            <label className="field"><span>Levels (comma separated)</span><input value={form.levels} onChange={set('levels')} placeholder="IGCSE, A-Level" /></label>
            <label className="field"><span>Hourly rate (USD)</span><input type="number" min="1" max="1000" value={form.hourlyRate} onChange={set('hourlyRate')} required /></label>
            <label className="field"><span>Intro video link (YouTube or Vimeo)</span><input type="url" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=…" /></label>
            <label className="field full"><span>About you</span><textarea value={form.bio} onChange={set('bio')} /></label>
            <label className="field full"><span>CV (qualifications and experience, one per line)</span><textarea style={{ minHeight: 140 }} value={form.cvText} onChange={set('cvText')} /></label>
          </div>
        </div>

        <div className="card">
          <h3>Weekly availability</h3>
          <p className="muted small">Students can book 60-minute slots inside these windows. Booked times are removed automatically, so double-booking is impossible.</p>
          <label className="field" style={{ maxWidth: 320, marginBottom: 18 }}><span>Time zone for these hours</span>
            <select value={form.tzOffset} onChange={(e) => setForm({ ...form, tzOffset: Number(e.target.value) })}>
              {offsets.map((o) => <option key={o} value={o}>{offsetLabel(o)}{o === deviceOffset() ? ' (this device)' : ''}</option>)}
            </select>
          </label>
          {windows.map((w, i) => (
            <div className="availability-row" key={i}>
              <label className="field"><span>Day</span><select value={w.weekday} onChange={(e) => setWin(i, 'weekday', e.target.value)}>{DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}</select></label>
              <label className="field"><span>From</span><input type="time" step="3600" value={w.start} onChange={(e) => setWin(i, 'start', e.target.value)} required /></label>
              <label className="field"><span>To</span><input type="time" step="3600" value={w.end} onChange={(e) => setWin(i, 'end', e.target.value)} required /></label>
              <button type="button" className="btn danger sm" onClick={() => setWindows(windows.filter((_, j) => j !== i))} aria-label="Remove window"><Trash2 size={15} /></button>
            </div>
          ))}
          <button type="button" className="btn ghost sm" onClick={() => setWindows([...windows, { weekday: 1, start: '14:00', end: '18:00' }])}><Plus size={15} /> Add window</button>
        </div>
        <button className="btn gold" disabled={busy}>{busy ? 'Saving…' : 'Save profile and availability'}</button>
      </form>
    </>
  );
}
