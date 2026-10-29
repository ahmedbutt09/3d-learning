import { useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../api';
import { fmtDateTime, money } from '../lib';
import { Alert, Modal } from './ui';

export default function PayModal({ booking, onClose, onPaid }) {
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvc: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.post(`/bookings/${booking.id}/pay`, card);
      onPaid(d.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Secure checkout" onClose={onClose}>
      <p className="muted small" style={{ marginTop: 0 }}>
        {booking.subject} with {booking.tutorName}<br />{fmtDateTime(booking.startAt)} · 60 minutes
      </p>
      <form onSubmit={submit} className="stack">
        <Alert>{error}</Alert>
        <Alert kind="info">Test mode: use card 4242 4242 4242 4242, any future date, any 3-digit CVC. No real money is charged.</Alert>
        <label className="field"><span>Card number</span>
          <input inputMode="numeric" autoComplete="cc-number" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: fmtCard(e.target.value) })} placeholder="1234 5678 9012 3456" required />
        </label>
        <div className="form-grid">
          <label className="field"><span>Expiry</span>
            <input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: fmtExp(e.target.value) })} required />
          </label>
          <label className="field"><span>CVC</span>
            <input inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })} required />
          </label>
        </div>
        <button className="btn gold block" disabled={busy}><Lock size={16} /> {busy ? 'Processing…' : `Pay ${money(booking.price)}`}</button>
        <p className="muted small center" style={{ margin: 0 }}>Your slot is held for 15 minutes while you complete payment.</p>
      </form>
    </Modal>
  );
}
