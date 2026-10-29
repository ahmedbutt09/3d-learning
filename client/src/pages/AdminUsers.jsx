import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { fmtDate } from '../lib';
import { Alert, Avatar, Badge, Modal, PageHead, Spinner } from '../components/ui';

function CreateUser({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'tutor' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/users', f); onDone(); } catch (err) { setError(err.message); }
  };
  return (
    <Modal title="Add a user" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Alert>{error}</Alert>
        <label className="field"><span>Role</span>
          <select value={f.role} onChange={set('role')}><option value="tutor">Tutor</option><option value="student">Student</option><option value="admin">Admin / owner</option></select>
        </label>
        <label className="field"><span>Full name</span><input value={f.name} onChange={set('name')} required /></label>
        <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} required /></label>
        <label className="field"><span>Temporary password (8+ characters)</span><input type="text" minLength={8} value={f.password} onChange={set('password')} required /></label>
        <button className="btn block">Create user</button>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => api.get('/admin/users').then((d) => setUsers(d.users)).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (u, status) => {
    setError('');
    try { await api.patch(`/admin/users/${u.id}`, { status }); load(); } catch (err) { setError(err.message); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setError('');
    try { await api.del(`/admin/users/${u.id}`); load(); } catch (err) { setError(err.message); }
  };

  if (!users) return <Spinner />;
  const shown = users.filter((u) => filter === 'all' || (filter === 'pending' ? u.status === 'pending' : u.role === filter));
  const pending = users.filter((u) => u.status === 'pending').length;

  return (
    <>
      <PageHead title="Users" subtitle="Approve tutors, suspend accounts and add new users.">
        <button className="btn gold" onClick={() => setAdding(true)}><Plus size={16} /> Add user</button>
      </PageHead>
      <Alert>{error}</Alert>
      <div className="tabs" style={{ maxWidth: 560 }}>
        {[['all', 'All'], ['student', 'Students'], ['tutor', 'Tutors'], ['admin', 'Owners'], ['pending', `Pending${pending ? ` (${pending})` : ''}`]].map(([k, l]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td><div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={u.name} size="sm" /><div><b>{u.name}</b><div className="muted small">{u.email}</div></div></div></td>
                <td style={{ textTransform: 'capitalize' }}>{u.role === 'admin' ? 'owner' : u.role}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td><Badge status={u.status} /></td>
                <td>
                  {u.id === me.id ? <span className="muted small">You</span> : (
                    <div className="actions">
                      {u.status === 'pending' && <button className="btn sm" onClick={() => setStatus(u, 'active')}>Approve</button>}
                      {u.status === 'active' && <button className="btn ghost sm" onClick={() => setStatus(u, 'suspended')}>Suspend</button>}
                      {u.status === 'suspended' && <button className="btn ghost sm" onClick={() => setStatus(u, 'active')}>Reactivate</button>}
                      <button className="btn danger sm" onClick={() => remove(u)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && <CreateUser onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
}
