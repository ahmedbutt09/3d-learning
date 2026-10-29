import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { fmtDate, money } from '../lib';
import { Badge, Empty, PageHead, Spinner } from '../components/ui';

export default function Payments() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/payments').then((d) => setRows(d.payments)).catch(() => setRows([])); }, []);
  if (!rows) return <Spinner />;

  const total = rows.filter((p) => p.status === 'paid').reduce((n, p) => n + p.amount, 0);
  const title = user.role === 'tutor' ? 'Earnings' : user.role === 'admin' ? 'All payments' : 'Payments';
  const label = user.role === 'student' ? 'Total spent' : user.role === 'tutor' ? 'Total earned' : 'Total revenue';

  return (
    <>
      <PageHead title={title} subtitle="Receipts for every session payment."><div className="card stat" style={{ padding: '12px 20px' }}><span className="label">{label}</span><span className="value">{money(total)}</span></div></PageHead>
      {rows.length === 0 ? <Empty>No payments yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Reference</th><th>Session</th>{user.role !== 'student' && <th>Student</th>}{user.role !== 'tutor' && <th>Tutor</th>}<th>Method</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.createdAt)}</td><td>{p.reference}</td><td>{p.subject}<div className="muted small">{fmtDate(p.startAt)}</div></td>
                  {user.role !== 'student' && <td>{p.studentName}</td>}{user.role !== 'tutor' && <td>{p.tutorName}</td>}
                  <td>{p.method}</td><td><b>{money(p.amount)}</b></td><td><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
