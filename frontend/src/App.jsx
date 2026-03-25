import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutCreatePage from './pages/WorkoutCreatePage';
import LiveWorkoutPage from './pages/LiveWorkoutPage';
import AttendancePage from './pages/AttendancePage';
import ClubManagementPage from './pages/ClubManagementPage';
import PastWorkoutsPage from './pages/PastWorkoutsPage';

function Protected({ children }) {
  const { coach, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Loading...</div>;
  if (!coach) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/live/:id" element={<LiveWorkoutPage />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/workouts/new" element={<Protected><WorkoutCreatePage /></Protected>} />
          <Route path="/workouts/:id/edit" element={<Protected><WorkoutCreatePage /></Protected>} />
          <Route path="/attendance" element={<Protected><AttendancePage /></Protected>} />
          <Route path="/manage" element={<Protected><ClubManagementPage /></Protected>} />
          <Route path="/workouts" element={<Protected><PastWorkoutsPage /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
