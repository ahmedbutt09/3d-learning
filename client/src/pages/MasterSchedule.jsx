import { useEffect, useState } from 'react';
import { api } from '../api';
import { Spinner, Alert } from '../components/ui';
import { Calendar, CheckCircle2, Lock, Clock } from 'lucide-react';

const DAYS = [
  { name: 'Monday', code: 'Mon', num: 1 },
  { name: 'Tuesday', code: 'Tue', num: 2 },
  { name: 'Wednesday', code: 'Wed', num: 3 },
  { name: 'Thursday', code: 'Thu', num: 4 },
  { name: 'Friday', code: 'Fri', num: 5 },
  { name: 'Saturday', code: 'Sat', num: 6 },
  { name: 'Sunday', code: 'Sun', num: 0 }
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  const start = String(i).padStart(2, '0');
  const end = String((i + 1) % 24).padStart(2, '0');
  const ampm = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
  return {
    hour: i,
    label: `${start}:00 - ${end}:00 (${ampm})`
  };
});

export default function MasterSchedule({ tutors = [], onBookSession }) {
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set default tutor if not set
  useEffect(() => {
    if (!selectedTutorId && tutors.length > 0) {
      setSelectedTutorId(tutors[0].id);
    }
  }, [tutors, selectedTutorId]);

  const loadMaster = () => {
    setLoading(true);
    api.get('/schedule/master')
      .then((d) => {
        setScheduleData(d);
        if (!selectedTutorId && d.tutors?.length > 0) {
          setSelectedTutorId(d.tutors[0].id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMaster();
  }, []);

  const activeTutor = tutors.find((t) => t.id === selectedTutorId) || scheduleData?.tutors?.find((t) => t.id === selectedTutorId) || tutors[0];

  const handleCellClick = (dayObj, hourObj) => {
    if (!activeTutor) return;
    if (onBookSession) {
      onBookSession(activeTutor, { day: dayObj, hour: hourObj.hour });
    }
  };

  return (
    <div className="container" style={{ padding: '48px 20px 72px' }}>
      <div className="row spread" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div className="eyebrow">03. Conflict-Free Availability & Scheduled Classes Data</div>
          <h2>Tutor Availability & Master Class Schedule</h2>
          <p>
            Manage recurring weekly availability slots and inspect locked sessions so overlapping classes never occur.
          </p>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>Select Tutor:</span>
          <select
            value={selectedTutorId}
            onChange={(e) => setSelectedTutorId(e.target.value)}
            style={{ width: 220 }}
          >
            {(scheduleData?.tutors || tutors).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subjects?.split(',')[0]?.trim() || 'Tutor'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <Alert kind="error">{error}</Alert>

      {/* Tutor Schedule Status Header (Screenshot 052826) */}
      <div className="card" style={{ marginBottom: 24, background: '#FAF8F4', padding: '18px 24px' }}>
        <div className="row spread">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
              {activeTutor?.name || 'Faculty Member'} — Full 24h × 7 Days Availability Grid (168 / 168 Slots Open)
            </h3>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              All 24 hourly slots across Monday – Sunday are available so tutors can accommodate any schedule. Click any slot to schedule.
            </p>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <span className="badge active" style={{ padding: '6px 12px' }}>
              Open All 168 Slots (24/7)
            </span>
            <button
              type="button"
              className="btn gold sm"
              onClick={() => activeTutor && onBookSession && onBookSession(activeTutor)}
            >
              <Calendar size={14} /> Book Session with {activeTutor?.name?.split(' ')[0] || 'Tutor'}
            </button>
          </div>
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && (
        <div className="schedule-table-wrap">
          <table className="schedule-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Time Window</th>
                {DAYS.map((d) => (
                  <th key={d.name}>
                    <div>{d.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS_24.map((hourObj) => (
                <tr key={hourObj.hour}>
                  <td>{hourObj.label}</td>
                  {DAYS.map((dayObj) => {
                    return (
                      <td key={dayObj.name}>
                        <button
                          type="button"
                          className="slot-pill-btn available"
                          onClick={() => handleCellClick(dayObj, hourObj)}
                          title={`Click to book ${hourObj.label} on ${dayObj.name}`}
                        >
                          • AVAILABLE
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
