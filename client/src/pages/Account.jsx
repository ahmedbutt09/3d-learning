import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Alert, PageHead } from '../components/ui';

export default function Account() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    try {
      const d = await api.put('/me', { name, password: password || undefined });
      setUser(d.user);
      setPassword('');
      setOk('Account updated.');
    } catch (err) { setError(err.message); }
  };

  return (
    <>
      <PageHead title="Account" subtitle="Manage your sign-in details." />
      <form className="card stack" style={{ maxWidth: 520 }} onSubmit={save}>
        <Alert>{error}</Alert><Alert kind="ok">{ok}</Alert>
        <label className="field"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="field"><span>Email</span><input value={user.email} disabled /></label>
        <label className="field"><span>New password (leave blank to keep current)</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" />
        </label>
        <button className="btn">Save changes</button>
      </form>
    </>
  );
}
