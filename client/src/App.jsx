import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { api } from './api';
import { DashLayout, PublicLayout } from './components/Layouts';
import { Spinner } from './components/ui';

// Studio Views
import SubjectsView from './pages/SubjectsView';
import Tutors from './pages/Tutors';
import TutorDetail from './pages/TutorDetail';
import MasterSchedule from './pages/MasterSchedule';
import StudentDashboard from './pages/StudentDashboard';
import MessagingView from './pages/MessagingView';
import ReviewsView from './pages/ReviewsView';

// Dedicated Auth & Portal pages
import { Login, Register } from './pages/Auth';
import Overview from './pages/Overview';
import Sessions from './pages/Sessions';
import Messages from './pages/Messages';
import Progress from './pages/Progress';
import Payments from './pages/Payments';
import Account from './pages/Account';
import TutorProfile from './pages/TutorProfile';
import AdminUsers from './pages/AdminUsers';

// Modals
import BookingModal from './components/BookingModal';
import TutorDetailModal from './components/TutorDetailModal';
import AddTutorModal from './components/AddTutorModal';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login/student" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  const [tutors, setTutors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');

  // Active Modals state
  const [bookingTutor, setBookingTutor] = useState(null);
  const [bookingSubject, setBookingSubject] = useState('');
  const [detailTutor, setDetailTutor] = useState(null);
  const [showAddTutor, setShowAddTutor] = useState(false);

  const loadData = () => {
    api.get('/tutors')
      .then((d) => setTutors(d.tutors || []))
      .catch(() => {});
    api.get('/reviews')
      .then((d) => setReviews(d.reviews || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBooking = (tutor, subject = '') => {
    setBookingTutor(tutor);
    setBookingSubject(subject);
  };

  return (
    <>
      <Routes>
        <Route element={<PublicLayout onOpenAddTutor={() => setShowAddTutor(true)} />}>
          {/* Main 6 Studio Tabs matching the Screenshots */}
          <Route
            path="/"
            element={
              <SubjectsView
                tutors={tutors}
                onScheduleSubject={handleOpenBooking}
                onFilterSubject={setFilterSubject}
              />
            }
          />
          <Route
            path="/subjects"
            element={
              <SubjectsView
                tutors={tutors}
                onScheduleSubject={handleOpenBooking}
                onFilterSubject={setFilterSubject}
              />
            }
          />
          <Route
            path="/tutors"
            element={
              <Tutors
                tutors={tutors}
                initialSubject={filterSubject}
                onOpenDetail={(t) => setDetailTutor(t)}
                onBook={(t) => handleOpenBooking(t)}
                onOpenAddTutor={() => setShowAddTutor(true)}
              />
            }
          />
          <Route
            path="/tutors/:id"
            element={<TutorDetail base="/tutors" />}
          />
          <Route
            path="/schedule"
            element={
              <MasterSchedule
                tutors={tutors}
                onBookSession={(t, slot) => handleOpenBooking(t)}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <StudentDashboard
                onOpenBookModal={() => {
                  if (tutors.length > 0) handleOpenBooking(tutors[0]);
                }}
              />
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <StudentDashboard
                onOpenBookModal={() => {
                  if (tutors.length > 0) handleOpenBooking(tutors[0]);
                }}
              />
            }
          />
          <Route
            path="/messaging"
            element={<MessagingView tutors={tutors} />}
          />
          <Route
            path="/messages"
            element={<MessagingView tutors={tutors} />}
          />
          <Route
            path="/reviews"
            element={<ReviewsView tutors={tutors} />}
          />

          {/* Separate Login Portals */}
          <Route path="/login" element={<Navigate to="/login/student" replace />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Authenticated Role-based Management Portals */}
        <Route path="/app" element={<Protected><DashLayout /></Protected>}>
          <Route index element={<Overview />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="messages" element={<Messages />} />
          <Route path="progress" element={<Progress />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<Protected roles={['tutor']}><TutorProfile /></Protected>} />
          <Route path="users" element={<Protected roles={['admin']}><AdminUsers /></Protected>} />
          <Route path="account" element={<Account />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          initialSubject={bookingSubject}
          onClose={() => setBookingTutor(null)}
          onBooked={() => {
            setBookingTutor(null);
            loadData();
          }}
        />
      )}

      {detailTutor && (
        <TutorDetailModal
          tutor={detailTutor}
          reviews={reviews}
          onClose={() => setDetailTutor(null)}
          onBook={(t) => handleOpenBooking(t)}
        />
      )}

      {showAddTutor && (
        <AddTutorModal
          onClose={() => setShowAddTutor(false)}
          onCreated={(newTutor) => {
            setShowAddTutor(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
