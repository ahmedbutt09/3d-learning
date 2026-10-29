import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { fmtTime, fmtDate } from '../lib';
import { Alert, Avatar, PageHead } from '../components/ui';

export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [convs, setConvs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(params.get('to') || '');
  const [thread, setThread] = useState({ user: null, messages: [] });
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bodyRef = useRef(null);
  const lastCount = useRef(0);

  const loadConvs = useCallback(() => api.get('/messages/conversations').then((d) => setConvs(d.conversations)).catch(() => {}), []);
  const loadThread = useCallback((id) => {
    if (!id) return Promise.resolve();
    return api.get(`/messages/${id}`).then((d) => setThread(d)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadConvs(); api.get('/messages/contacts').then((d) => setContacts(d.contacts)).catch(() => {}); }, [loadConvs]);

  // Near real-time: poll the open conversation and the list.
  useEffect(() => {
    if (!active) return undefined;
    setThread({ user: null, messages: [] });
    lastCount.current = 0;
    loadThread(active);
    const t = setInterval(() => { loadThread(active); loadConvs(); }, 3000);
    return () => clearInterval(t);
  }, [active, loadThread, loadConvs]);

  useEffect(() => {
    if (thread.messages.length !== lastCount.current && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      lastCount.current = thread.messages.length;
    }
  }, [thread.messages]);

  const open = (id) => { setError(''); setActive(id); setParams(id ? { to: id } : {}); };

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await api.post('/messages', { to: active, body });
      await loadThread(active);
      loadConvs();
    } catch (err) { setError(err.message); setText(body); }
  };

  const known = new Set(convs.map((c) => c.userId));
  const newContacts = contacts.filter((c) => !known.has(c.id));
  const activeName = thread.user?.name || convs.find((c) => c.userId === active)?.name || contacts.find((c) => c.id === active)?.name || '';

  return (
    <>
      <PageHead title="Messages" subtitle="Chat directly. New messages appear automatically." />
      <div className="chat">
        <div className={`chat-list ${active ? 'hide' : ''}`}>
          <div className="new">
            <label className="field"><span className="sr-only">Start a conversation</span>
              <select value="" onChange={(e) => e.target.value && open(e.target.value)}>
                <option value="">+ New conversation…</option>
                {newContacts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.role === 'admin' ? 'owner' : c.role})</option>)}
              </select>
            </label>
          </div>
          {convs.length === 0 && <p className="muted small" style={{ padding: 16 }}>No conversations yet. Start one above.</p>}
          {convs.map((c) => (
            <button key={c.userId} className={`conv ${active === c.userId ? 'on' : ''}`} onClick={() => open(c.userId)}>
              <Avatar name={c.name} size="sm" />
              <div className="meta"><b>{c.name}</b><span>{c.last}</span></div>
              {c.unread > 0 && <span className="dot">{c.unread}</span>}
            </button>
          ))}
        </div>
        <div className={`thread ${active ? '' : 'hide'}`}>
          {!active ? (
            <div className="muted center" style={{ margin: 'auto', padding: 24 }}>Select a conversation to start chatting.</div>
          ) : (
            <>
              <div className="thread-head">
                <button className="btn ghost sm back-btn" onClick={() => open('')} aria-label="Back to conversations"><ArrowLeft size={16} /></button>
                <Avatar name={activeName} size="sm" />
                <b>{activeName}</b>
              </div>
              <div className="thread-body" ref={bodyRef}>
                <Alert>{error}</Alert>
                {thread.messages.length === 0 && <p className="muted small center">Say hello 👋</p>}
                {thread.messages.map((m, i) => {
                  const prev = thread.messages[i - 1];
                  const newDay = !prev || fmtDate(prev.createdAt) !== fmtDate(m.createdAt);
                  return (
                    <div key={m.id} style={{ display: 'contents' }}>
                      {newDay && <div className="muted small center" style={{ margin: '6px 0' }}>{fmtDate(m.createdAt)}</div>}
                      <div className={`bubble ${m.senderId === user.id ? 'me' : ''}`}>{m.body}<time>{fmtTime(m.createdAt)}</time></div>
                    </div>
                  );
                })}
              </div>
              <form className="composer" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" maxLength={2000} aria-label="Message" />
                <button className="btn" aria-label="Send"><Send size={16} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
