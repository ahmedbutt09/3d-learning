import { useState } from 'react';
import { StudioModal, Alert } from './ui';
import { api } from '../api';
import { Check, ShieldCheck, Mail, Calendar, Clock, CreditCard } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const start = String(i).padStart(2, '0');
  const end = String((i + 1) % 24).padStart(2, '0');
  const ampm = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
  return {
    hour: i,
    label: `${start}:00 - ${end}:00 (${ampm})`
  };
});

const PRESET_FEES = [0, 10, 15, 20, 25, 30, 40, 50];

export default function BookingModal({ tutor, initialSubject = '', onClose, onBooked }) {
  // Generate 7 days starting from tomorrow
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      date: d,
      key: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      weekday: d.getDay()
    };
  });

  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedHour, setSelectedHour] = useState(14); // 2:00 PM default
  const [customTime, setCustomTime] = useState('');
  const [subject, setSubject] = useState(initialSubject || tutor?.subjects?.split(',')[0]?.trim() || 'Mathematics');
  const [durationMin, setDurationMin] = useState(60);
  const [topic, setTopic] = useState(`${subject}: Live Tutoring & Exam Technique Session`);
  const [fee, setFee] = useState(tutor?.hourlyRate !== undefined ? tutor.hourlyRate : 25);
  const [paymentOption, setPaymentOption] = useState('card'); // 'free_trial' | 'card' | 'credit'
  const [cardName, setCardName] = useState('Alex Rivera');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('08/29');
  const [cvc, setCvc] = useState('842');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subjectsList = tutor?.subjects ? tutor.subjects.split(',').map((s) => s.trim()).filter(Boolean) : [subject];

  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };

  const handleFeeSelect = (amount) => {
    setFee(amount);
    if (amount === 0) setPaymentOption('free_trial');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Construct date
      const startTime = new Date(selectedDay.date);
      startTime.setHours(selectedHour, 0, 0, 0);

      const payload = {
        tutorId: tutor.id,
        startAt: startTime.toISOString(),
        durationMin: Number(durationMin),
        subject,
        topic,
        customTime,
        lessonFee: paymentOption === 'free_trial' ? 0 : Number(fee),
        paymentOption,
        cardNumber,
        expiry,
        cvc,
        cardholderName: cardName,
        notes,
        isFreeTrial: paymentOption === 'free_trial'
      };

      const res = await api.post('/bookings', payload);
      if (onBooked) onBooked(res.booking);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete scheduling');
    } finally {
      setLoading(false);
    }
  };

  const totalDue = paymentOption === 'free_trial' ? 0 : Number(fee);

  return (
    <StudioModal
      title={`Schedule Session with ${tutor?.name || 'Tutor'}`}
      subtitle="The Third Dimension Learning Institute · All 24-Hour Slots Open for Tutor Accommodation"
      onClose={onClose}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        <Alert kind="error">{error}</Alert>

        {/* 01. Select Session Day */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow">01. Select Session Day (Monday – Sunday)</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {days.map((d) => {
              const isSelected = selectedDay.key === d.key;
              return (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => handleDaySelect(d)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--navy)' : 'var(--line)',
                    background: isSelected ? 'var(--navy)' : '#FFF',
                    color: isSelected ? '#FFF' : 'var(--ink)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    textAlign: 'center',
                    minWidth: 105
                  }}
                >
                  <div>{d.dayName}</div>
                  <div style={{ fontSize: '0.72rem', opacity: isSelected ? 0.9 : 0.6 }}>{d.key}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 02. Select Any Hourly Time Slot */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow">02. Select Any Hourly Time Slot (All 24 Hours Available · Overlap Protection Active)</div>
          <div className="slot-select-grid">
            {HOURS.map((h) => {
              const isSelected = selectedHour === h.hour;
              return (
                <button
                  type="button"
                  key={h.hour}
                  onClick={() => setSelectedHour(h.hour)}
                  className={`slot-select-item ${isSelected ? 'selected' : ''}`}
                >
                  {h.label} {isSelected ? '• SELECTED' : '• OPEN'}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="field" style={{ margin: 0 }}>
              <span className="muted small">Or enter a custom flexible time agreed with the tutor (optional):</span>
              <input
                type="text"
                placeholder="e.g., 10:30 AM - 11:30 AM (Custom Tutor Accommodation)"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* 03. Subject, Duration & Focus */}
        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div>
            <label className="field">
              <span>03. Select Subject</span>
              <select value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(`${e.target.value}: Live Tutoring & Exam Technique Session`); }}>
                {subjectsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="field">
              <span>Session Duration</span>
              <select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </label>
          </div>

          <div className="full">
            <label className="field">
              <span>Lesson Focus & Problem Set Topic</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Mathematics: Live Tutoring & Exam Technique Session"
              />
            </label>
          </div>
        </div>

        {/* Customize Lesson Fee */}
        <div style={{ marginBottom: 20, background: '#FAF8F4', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
          <div className="row spread" style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Customize Lesson Fee ($ USD)</span>
            <span className="muted small">Set any agreed fee or select a preset below</span>
          </div>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <div className="fee-presets">
              {PRESET_FEES.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  className={`fee-btn ${fee === amt ? 'selected' : ''}`}
                  onClick={() => handleFeeSelect(amt)}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <span>$</span>
              <input
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                style={{ width: 80, height: 38 }}
              />
              <span className="muted small">USD</span>
            </div>
          </div>
        </div>

        {/* 04. Tuition Option & Payment Processing */}
        <div style={{ marginBottom: 22 }}>
          <div className="row spread" style={{ marginBottom: 12 }}>
            <div className="eyebrow" style={{ margin: 0 }}>04. Tuition Option & Payment Processing</div>
            <div className="row" style={{ gap: 6 }}>
              <button
                type="button"
                className={`fee-btn ${paymentOption === 'free_trial' ? 'selected' : ''}`}
                onClick={() => { setPaymentOption('free_trial'); setFee(0); }}
              >
                Free Trial ($0)
              </button>
              <button
                type="button"
                className={`fee-btn ${paymentOption === 'card' ? 'selected' : ''}`}
                onClick={() => setPaymentOption('card')}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                className={`fee-btn ${paymentOption === 'credit' ? 'selected' : ''}`}
                onClick={() => setPaymentOption('credit')}
              >
                Institute Credit
              </button>
            </div>
          </div>

          {paymentOption === 'card' && (
            <div style={{ background: '#FFF', border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
              <div className="form-grid">
                <div className="full">
                  <label className="field">
                    <span>Cardholder Name</span>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Cardholder Name"
                    />
                  </label>
                </div>
                <div className="full">
                  <label className="field">
                    <span>Card Number</span>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                    />
                  </label>
                </div>
                <div>
                  <label className="field">
                    <span>Expiry</span>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                    />
                  </label>
                </div>
                <div>
                  <label className="field">
                    <span>CVC</span>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      placeholder="CVC"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {paymentOption === 'free_trial' && (
            <div className="alert ok" style={{ margin: 0 }}>
              <ShieldCheck size={20} />
              <span><strong>Free Trial Eligible:</strong> First lesson is $0.00 USD with full 1-on-1 access and classroom lock.</span>
            </div>
          )}

          {paymentOption === 'credit' && (
            <div className="alert info" style={{ margin: 0 }}>
              <CreditCard size={20} />
              <span>Tuition will be deducted from your active student account credit balance.</span>
            </div>
          )}
        </div>

        {/* Automated Email & Real-Time Dispatch Box */}
        <div style={{ background: '#F0F6FC', border: '1px solid #C4D9ED', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          <Mail size={18} style={{ color: '#2B5C8F', marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: '#1B3D64' }}>
            <strong>Automated Email & Real-Time Dispatch:</strong> Confirming this booking dispatches an instant email confirmation with your 3D Video Classroom code, invoice receipt, and calendar lock to both you and {tutor?.name}.
          </div>
        </div>

        {/* Footer Bar */}
        <div className="row spread" style={{ alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <div>
            <div className="muted small">Total Tuition Due</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--serif)' }}>
              ${totalDue.toFixed(2)} USD
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn gold" disabled={loading}>
              {loading ? 'Processing...' : `Authorize $${totalDue.toFixed(2)} & Schedule Class`}
            </button>
          </div>
        </div>
      </form>
    </StudioModal>
  );
}
