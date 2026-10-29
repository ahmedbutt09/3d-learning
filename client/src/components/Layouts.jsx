import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, CalendarClock, MessageSquare, LineChart, CreditCard,
  UserCircle, Users, LogOut, Menu, X, Plus, ChevronDown, Mail, Instagram,
  GraduationCap, UserCog, Calendar
} from 'lucide-react';
import { useAuth } from '../auth';
import { Brand } from './ui';
import AddTutorModal from './AddTutorModal';

export function PublicLayout({ onOpenAddTutor }) {
  const { user, loginAs, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    setMobileMenuOpen(false);
    setModeMenuOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  const currentRole = user?.role || 'student';
  const modeLabel = currentRole === 'admin' ? 'Owner (Admin) View' : currentRole === 'tutor' ? 'Tutor View' : 'Student View';

  const handleModeSwitch = async (targetRole) => {
    setModeMenuOpen(false);
    if (targetRole === 'signout') {
      logout();
      nav('/');
      return;
    }
    // Quick demo login switch
    try {
      if (targetRole === 'admin') {
        await loginAs('admin@3dlearning.com', 'Admin@12345', 'admin');
        nav('/app');
      } else if (targetRole === 'tutor') {
        await loginAs('ayesha@3dlearning.com', 'Tutor@12345', 'tutor');
        nav('/app');
      } else {
        await loginAs('student@3dlearning.com', 'Student@12345', 'student');
        nav('/dashboard');
      }
    } catch {
      // If error, redirect to explicit login
      nav(`/login/${targetRole}`);
    }
  };

  return (
    <>
      {/* Top Contact Strip (Matching Screenshot 052200) */}
      <div className="site-top-bar">
        <div className="container inner">
          <div className="top-contact">
            <a href="mailto:3dlearninginstitute@gmail.com">
              <Mail size={14} /> Email us at: 3dlearninginstitute@gmail.com
            </a>
            <span>
              <Instagram size={14} /> Instagram: @3dlearninginstitute
            </span>
          </div>
          <div className="row" style={{ gap: 14 }}>
            {user ? (
              <span style={{ color: '#E5A93C', fontWeight: 600 }}>
                Signed in as {user.name} ({user.role})
              </span>
            ) : (
              <div className="row" style={{ gap: 10 }}>
                <Link to="/login/student" style={{ color: '#E2ECF7' }}>Student Login</Link>
                <span>·</span>
                <Link to="/login/tutor" style={{ color: '#E2ECF7' }}>Tutor Login</Link>
                <span>·</span>
                <Link to="/login/admin" style={{ color: '#E2ECF7' }}>Owner Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Navbar (Screenshots 052200, 052424, 052826) */}
      <header className="site-header">
        <div className="container inner">
          <Brand />

          <button
            className="menu-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 0, color: '#FFF' }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Navigation Tabs */}
          <nav className={`nav-tabs ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              Subjects Offered
            </NavLink>
            <NavLink to="/tutors" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              Tutors & CVs
            </NavLink>
            <NavLink to="/schedule" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              Schedule
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              Student Dashboard
            </NavLink>
            <NavLink to="/messaging" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              Messaging
            </NavLink>
            <NavLink to="/reviews" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              Reviews
            </NavLink>
          </nav>

          {/* Actions: + Add Tutor & Mode Switcher */}
          <div className="header-actions">
            <button
              type="button"
              className="btn gold sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={15} /> Add Tutor & Upload CV
            </button>

            {/* Mode Switcher Pill */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="mode-pill"
                onClick={() => setModeMenuOpen((o) => !o)}
              >
                <span>Mode: {modeLabel}</span>
                <ChevronDown size={14} />
              </button>

              {modeMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 6,
                    background: '#FFF',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 200,
                    zIndex: 100,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', background: '#FAF8F4', borderBottom: '1px solid var(--line)' }}>
                    Switch View / Account
                  </div>
                  <button
                    type="button"
                    style={{ padding: '10px 14px', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--ink)' }}
                    onClick={() => handleModeSwitch('student')}
                  >
                    👤 Student View
                  </button>
                  <button
                    type="button"
                    style={{ padding: '10px 14px', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--ink)' }}
                    onClick={() => handleModeSwitch('tutor')}
                  >
                    🎓 Tutor View
                  </button>
                  <button
                    type="button"
                    style={{ padding: '10px 14px', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--ink)' }}
                    onClick={() => handleModeSwitch('admin')}
                  >
                    👑 Owner (Admin) View
                  </button>
                  {user && (
                    <button
                      type="button"
                      style={{ padding: '10px 14px', border: 0, borderTop: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--bad)' }}
                      onClick={() => handleModeSwitch('signout')}
                    >
                      🚪 Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main>
        <Outlet />
      </main>

      {/* Edemis Editorial Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Brand />
              <p style={{ marginTop: 16, maxWidth: '42ch', fontSize: '0.92rem', lineHeight: 1.6 }}>
                The Third Dimension Learning Institute provides structured British curriculum tuition across Elementary, Middle & High School. Verified subject specialists, conflict-free scheduling, live video classrooms and transparent outcomes.
              </p>
            </div>

            <div>
              <h4>Academic Navigation</h4>
              <ul>
                <li><Link to="/">Official Curriculum</Link></li>
                <li><Link to="/tutors">Faculty Directory & CVs</Link></li>
                <li><Link to="/schedule">Master Availability Schedule</Link></li>
                <li><Link to="/dashboard">Student Academic Portal</Link></li>
                <li><Link to="/messaging">Direct Faculty Messaging</Link></li>
                <li><Link to="/reviews">Student Testimonials & Reviews</Link></li>
              </ul>
            </div>

            <div>
              <h4>Separate Logins</h4>
              <ul>
                <li><Link to="/login/student">Student Academic Login</Link></li>
                <li><Link to="/login/tutor">Faculty / Tutor Portal</Link></li>
                <li><Link to="/login/admin">Institute Owner Login</Link></li>
                <li><Link to="/register">Register New Student Account</Link></li>
                <li><Link to="/app">Dedicated Management Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom row spread">
            <div>
              © {new Date().getFullYear()} The Third Dimension Learning Institute (3D Learning). All rights reserved.
            </div>
            <div>
              edemis.com editorial style · Cross-platform desktop & mobile
            </div>
          </div>
        </div>
      </footer>

      {showAddModal && (
        <AddTutorModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

const DASH_NAV = {
  student: [
    ['/app', 'Overview', LayoutDashboard, true],
    ['/app/sessions', 'My Sessions', CalendarClock],
    ['/app/progress', 'Progress Analytics', LineChart],
    ['/app/payments', 'Payments & Invoices', CreditCard],
    ['/app/messages', 'Messages', MessageSquare],
    ['/app/account', 'My Account', UserCircle],
  ],
  tutor: [
    ['/app', 'Overview', LayoutDashboard, true],
    ['/app/sessions', 'Sessions', CalendarClock],
    ['/app/progress', 'Students & Progress', GraduationCap],
    ['/app/profile', 'Profile & Availability', UserCog],
    ['/app/payments', 'Earnings', CreditCard],
    ['/app/messages', 'Messages', MessageSquare],
    ['/app/account', 'Account', UserCircle],
  ],
  admin: [
    ['/app', 'Institute Overview', LayoutDashboard, true],
    ['/app/users', 'Manage Users & Tutors', Users],
    ['/app/sessions', 'All Sessions', CalendarClock],
    ['/app/payments', 'Tuition Ledger & Revenue', CreditCard],
    ['/app/progress', 'Progress Logs', LineChart],
    ['/app/messages', 'Messages', MessageSquare],
    ['/app/account', 'Account', UserCircle],
  ],
};

export function DashLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const items = DASH_NAV[user?.role] || DASH_NAV.student;

  return (
    <div className="shell">
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Brand to="/app" />
        <div style={{ margin: '14px 0 6px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#889BB0', padding: '0 12px' }}>
          {user.role === 'admin' ? 'Owner Portal' : user.role === 'tutor' ? 'Faculty Portal' : 'Student Portal'}
        </div>
        <nav style={{ display: 'grid', gap: 4 }}>
          {items.map(([path, label, Icon, end]) => (
            <NavLink key={path} to={path} end={Boolean(end)} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <Link to="/" className="side-link" style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Calendar size={18} />
            <span>Public Studio App</span>
          </Link>
        </nav>

        <div className="side-foot">
          <div className="side-user">
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E5A93C', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {user.name[0]}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <small style={{ color: '#889BB0' }}>{user.email}</small>
            </div>
          </div>
          <button
            className="btn ghost-dark sm block"
            onClick={() => { logout(); nav('/'); }}
            style={{ marginTop: 8 }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <Brand to="/app" />
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
