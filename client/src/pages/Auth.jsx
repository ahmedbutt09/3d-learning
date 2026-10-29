import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { Alert } from '../components/ui';

const ROLES = [
  ['student', 'Student'],
  ['tutor', 'Tutor'],
  ['admin', 'Owner'],
];

export function Login() {
  const { role = 'student' } = useParams();
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!ROLES.some(([r]) => r === role)) return <Navigate to="/login/student" replace />;
  if (user) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password, role);
      nav('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const label = ROLES.find(([r]) => r === role)[1];

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2 style={{ fontSize: '1.9rem' }}>Welcome back</h2>
        <p className="muted">Sign in to your {label.toLowerCase()} portal.</p>
        <div className="tabs" role="tablist">
          {ROLES.map(([r, l]) => (
            <Link key={r} to={`/login/${r}`} className={r === role ? 'on' : ''} role="tab" aria-selected={r === role}>{l}</Link>
          ))}
        </div>
        <form onSubmit={submit} className="stack">
          <Alert>{error}</Alert>
          <label className="field"><span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field"><span>Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn block" disabled={busy}>{busy ? 'Signing in…' : `Sign in as ${label.toLowerCase()}`}</button>
        </form>
        {role !== 'admin' && (
          <p className="muted small center" style={{ marginTop: 18, marginBottom: 0 }}>
            New here? <Link to="/register">Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      nav('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2 style={{ fontSize: '1.9rem' }}>Create your account</h2>
        <p className="muted">Join as a student or apply to teach.</p>
        <div className="tabs">
          {[['student', 'I am a student'], ['tutor', 'I am a tutor']].map(([r, l]) => (
            <button type="button" key={r} className={form.role === r ? 'on' : ''} onClick={() => setForm({ ...form, role: r })}>{l}</button>
          ))}
        </div>
        <form onSubmit={submit} className="stack">
          <Alert>{error}</Alert>
          {form.role === 'tutor' && <Alert kind="info">Tutor accounts are reviewed by the institute owner before they appear in the directory.</Alert>}
          <label className="field"><span>Full name</span><input value={form.name} onChange={set('name')} autoComplete="name" required /></label>
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></label>
          <label className="field"><span>Password (8+ characters)</span><input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={8} required /></label>
          <button className="btn block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="muted small center" style={{ marginTop: 18, marginBottom: 0 }}>
          Already registered? <Link to={`/login/${form.role}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
