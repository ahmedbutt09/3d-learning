import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { GraduationCap, Sparkles, X } from 'lucide-react';
import { STATUS_LABEL, initials } from '../lib';

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand brand-logo-wrap" aria-label="3D Learning Institute">
      <img
        src="/logo.jpg"
        alt="3D Learning Institute"
        className="brand-logo-img"
      />
    </Link>
  );
}

export const Avatar = ({ name, size = '' }) => (
  <span className={`tutor-avatar-box ${size}`} aria-hidden="true">
    {initials(name)}
  </span>
);

export const Badge = ({ status }) => (
  <span className={`badge ${status}`}>{STATUS_LABEL[status] || status}</span>
);

export const Spinner = () => <div className="spinner" role="status" aria-label="Loading" />;

export const Alert = ({ kind = 'error', children }) =>
  children ? (
    <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  ) : null;

export const Empty = ({ children }) => (
  <div className="card flat center" style={{ padding: '40px 20px', color: 'var(--muted)', background: '#FAF8F4' }}>
    {children}
  </div>
);

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)' }}>{title}</h1>
        {subtitle && <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{subtitle}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function StudioModal({ title, subtitle, onClose, children, size = '' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-window ${size}`} role="dialog" aria-modal="true">
        <div className="modal-header-studio">
          <div>
            {subtitle && <div className="modal-header-sub">{subtitle}</div>}
            <h3>{title}</h3>
          </div>
          <button
            className="btn ghost-dark sm"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body-scroll">{children}</div>
      </div>
    </div>
  );
}

export const Modal = StudioModal;

export function Stars({ value = 5, onChange }) {
  return (
    <span className="stars" role={onChange ? 'radiogroup' : 'img'} style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            style={{
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: n <= value ? '#E5A93C' : '#D1D8E0',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '0 2px'
            }}
          >
            ★
          </button>
        ) : (
          <span key={n} style={{ color: n <= Math.round(value) ? '#E5A93C' : '#D1D8E0', fontSize: '1rem' }}>
            ★
          </span>
        )
      )}
    </span>
  );
}
