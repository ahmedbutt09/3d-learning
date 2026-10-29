import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Spinner, Alert } from '../components/ui';
import { Send, MessageSquare, User, Check, Shield } from 'lucide-react';

const TOPIC_PRESETS = [
  'Free Trial / Class Inquiry',
  'Syllabus & Curriculum Question',
  'Homework & Problem Set Help',
  'Exam Revision & Past Papers',
  'Scheduling Flexibility'
];

export default function MessagingView({ tutors = [] }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Free Trial / Class Inquiry');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Load contacts
  const loadContacts = () => {
    api.get('/messages/contacts')
      .then((d) => {
        const list = d.contacts || [];
        setContacts(list);
        if (!activeContact && list.length > 0) {
          setActiveContact(list[0]);
        }
      })
      .catch(() => {
        // Fallback to tutors list if not signed in or contacts empty
        if (tutors.length > 0 && !activeContact) {
          setContacts(tutors);
          setActiveContact(tutors[0]);
        }
      });
  };

  useEffect(() => {
    loadContacts();
  }, [tutors]);

  // Load messages for active contact
  const loadMessages = () => {
    if (!activeContact) return;
    api.get(`/messages/${activeContact.id}`)
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeContact) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/messages', {
        to: activeContact.id,
        body: text.trim(),
        subject: selectedTopic
      });
      setText('');
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '48px 20px 72px' }}>
      <div className="section-head">
        <div className="eyebrow">05. Direct Faculty Communication Channel</div>
        <h2>Secure In-App Academic Messaging</h2>
        <p>
          Message tutors directly regarding syllabus topics, worksheets, or scheduling updates.
        </p>
      </div>

      <Alert kind="error">{error}</Alert>

      <div className="chat-container">
        {/* Contacts Sidebar */}
        <div className="chat-sidebar">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: '0.86rem', color: 'var(--navy)' }}>
            3D Learning Faculty & Tutors
          </div>

          <div>
            {(contacts.length > 0 ? contacts : tutors).map((c) => {
              const isActive = activeContact?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`chat-contact ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveContact(c)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: isActive ? '#E5A93C' : 'var(--navy)',
                      color: isActive ? 'var(--navy)' : '#E5A93C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}
                  >
                    {c.name ? c.name[0] : 'T'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <small style={{ color: isActive ? '#C2D3E5' : 'var(--muted)', fontSize: '0.78rem' }}>
                      {c.role === 'admin' ? 'Institute Owner' : c.subjects?.split(',')[0] || 'Tutor'}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="chat-main">
          <div className="chat-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                Conversation with {activeContact?.name || 'Faculty Member'}
              </h3>
              <div className="muted small" style={{ fontSize: '0.78rem' }}>
                Instant in-app messaging active · Response time ~ 15 mins
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span className="badge active">Active Channel</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="muted small center" style={{ margin: 'auto', padding: '40px 20px' }}>
                No messages in this thread yet. Send your question or scheduling note below.
              </div>
            ) : (
              messages.map((m) => {
                const isMe = user ? m.senderId === user.id : m.senderId !== activeContact?.id;
                return (
                  <div
                    key={m.id}
                    className={`message-bubble ${isMe ? 'outgoing' : 'incoming'}`}
                  >
                    {m.subject && (
                      <div style={{ fontSize: '0.74rem', opacity: 0.75, fontWeight: 600, marginBottom: 2 }}>
                        [{m.subject}]
                      </div>
                    )}
                    <div>{m.body}</div>
                    <span className="message-time">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose Area */}
          <form className="chat-compose-area" onSubmit={handleSend}>
            {/* Quick Topic Presets */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {TOPIC_PRESETS.map((top) => (
                <button
                  type="button"
                  key={top}
                  className={`fee-btn ${selectedTopic === top ? 'selected' : ''}`}
                  style={{ fontSize: '0.76rem', padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}
                  onClick={() => setSelectedTopic(top)}
                >
                  {top}
                </button>
              ))}
            </div>

            <div className="row" style={{ gap: 10 }}>
              <input
                type="text"
                placeholder="Write your message to the tutor..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn gold"
                disabled={loading || !text.trim()}
                style={{ padding: '0 20px' }}
              >
                <Send size={15} /> Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
