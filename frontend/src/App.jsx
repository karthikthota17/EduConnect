import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/authSlice';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ClassDetails from './pages/ClassDetails';
import QuizBuilder from './pages/QuizBuilder';
import AssignmentDetails from './pages/AssignmentDetails';
import TakeQuiz from './pages/TakeQuiz';
import LiveClass from './pages/LiveClass';
import TakeAttendance from './pages/TakeAttendance';
import AdminDashboard from './pages/AdminDashboard';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import JoinClassViaQR from './pages/JoinClassViaQR';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { Loader2 } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  return isAuthenticated ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector(state => state.auth);
  if (isLoading) return <div>Loading...</div>;
  return (isAuthenticated && user?.role === 'admin') ? children : <Navigate to="/dashboard" />;
};

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(getMe());
    }
  }, [dispatch]);

  return (
    <Router>
      <SocketProvider>
        <ToastProvider>
        <div className="font-sans text-slate-900 bg-white min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId" 
            element={
              <PrivateRoute>
                <ClassDetails />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId/assignment/:assignmentId" 
            element={
              <PrivateRoute>
                <AssignmentDetails />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId/quiz/new" 
            element={
              <PrivateRoute>
                <QuizBuilder />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId/quiz/:quizId/edit" 
            element={
              <PrivateRoute>
                <QuizBuilder />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId/quiz/:quizId" 
            element={
              <PrivateRoute>
                <TakeQuiz />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId/live" 
            element={
              <PrivateRoute>
                <LiveClass />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/class/:classId/attendance/:token" 
            element={
              <PrivateRoute>
                <TakeAttendance />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/join/:code" 
            element={
              <PrivateRoute>
                <JoinClassViaQR />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
      </ToastProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
