import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CreditCard, LineChart, MessageSquare, PlayCircle, ShieldCheck, Check } from 'lucide-react';
import { api } from '../api';
import { TutorCard } from './Tutors';

const FEATURES = [
  [PlayCircle, 'Tutor CVs and intro videos', 'Read each specialist’s qualifications and watch a short introduction before you book.'],
  [CalendarCheck, 'Conflict-free scheduling', 'Live availability means a slot can never be double-booked. Join lessons by secure video.'],
  [CreditCard, 'Integrated payments', 'Pay per session at checkout. Transparent receipts and automatic refunds for early cancellations.'],
  [LineChart, 'Progress analytics', 'Tutors log scores and topic notes after lessons. Students see their growth by subject over time.'],
  [MessageSquare, 'Live messaging', 'Message your tutor directly to share questions, homework and feedback between lessons.'],
  [ShieldCheck, 'Approved tutors only', 'Every tutor is reviewed and approved by the institute owner before appearing in the directory.'],
];

export default function Home() {
  const [tutors, setTutors] = useState([]);
  useEffect(() => { api.get('/tutors').then((d) => setTutors(d.tutors.slice(0, 3))).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">The Third Dimension Learning Institute</div>
            <h1>Online tutoring with <em>depth</em>, structure and care.</h1>
            <p className="lead">
              Learn one-to-one with subject specialists. Book a lesson in seconds, meet by video, track your progress and stay in touch, all in one place.
            </p>
            <div className="row">
              <Link to="/register" className="btn gold">Start learning</Link>
              <Link to="/tutors" className="btn ghost">Browse tutors</Link>
            </div>
          </div>
          <div className="hero-panel">
            <h3>Everything you need to learn well</h3>
            <ul>
              {['Individual lessons paced to your level', 'Maths, Sciences, English, Humanities and more', 'KS3, IGCSE/GCSE and A-Level support', 'Flexible times across time zones'].map((t) => (
                <li key={t}><Check size={18} /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Platform</div>
            <h2>Built around real learning outcomes</h2>
            <p>One platform for students, tutors and the institute owner, each with their own secure sign-in.</p>
          </div>
          <div className="grid c3">
            {FEATURES.map(([Icon, title, text]) => (
              <div className="feature" key={title}>
                <div className="ico"><Icon size={22} /></div>
                <h3>{title}</h3>
                <p className="muted" style={{ margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">How it works</div>
            <h2>From first look to first lesson in four steps</h2>
          </div>
          <div className="grid c4">
            {[
              ['1', 'Choose a tutor', 'Filter by subject and level, read the CV and watch the intro video.'],
              ['2', 'Pick a time', 'See open slots in your own time zone. Taken times disappear instantly.'],
              ['3', 'Pay securely', 'Confirm your booking at checkout and get a receipt.'],
              ['4', 'Learn and track', 'Join by video, message your tutor and follow your progress charts.'],
            ].map(([n, t, d]) => (
              <div className="card flat" key={n}>
                <div className="eyebrow">Step {n}</div>
                <h3>{t}</h3>
                <p className="muted" style={{ margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {tutors.length > 0 && (
        <section className="section alt">
          <div className="container">
            <div className="row spread" style={{ alignItems: 'flex-end' }}>
              <div className="section-head" style={{ marginBottom: 24 }}>
                <div className="eyebrow">Teachers</div>
                <h2>Meet the educators</h2>
                <p>Subject depth, individual continuity and clear communication.</p>
              </div>
              <Link to="/tutors" className="btn ghost">See all tutors</Link>
            </div>
            <div className="grid c3">{tutors.map((t) => <TutorCard key={t.id} tutor={t} />)}</div>
          </div>
        </section>
      )}

      <section className="section dark">
        <div className="container">
          <div className="stat-line">
            <div><b>1:1</b><span>Individual lessons</span></div>
            <div><b>60 min</b><span>Per session, by video</span></div>
            <div><b>24/7</b><span>Booking and messaging</span></div>
            <div><b>3</b><span>Dedicated portals</span></div>
          </div>
          <div className="center" style={{ marginTop: 48 }}>
            <h2>Ready to begin?</h2>
            <p style={{ color: '#b7c3d0' }}>Create a free account and book your first lesson today.</p>
            <Link to="/register" className="btn gold">Create your account</Link>
          </div>
        </div>
      </section>
    </>
  );
}
