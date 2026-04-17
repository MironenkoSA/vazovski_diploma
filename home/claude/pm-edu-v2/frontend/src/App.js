import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import './styles/global.css';

import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import DashboardPage from './pages/student/DashboardPage';
import { CatalogPage, CoursePurchasePage } from './pages/student/CatalogPages';
import { CourseDetailPage, LessonPage } from './pages/student/CoursePages';
import { HomeworkPage, CourseStatsPage, MyHomeworkPage, MyOrdersPage } from './pages/teacher/TeacherPages';
import { AdminUsersPage, AdminCoursesPage, AdminOrdersPage } from './pages/admin/AdminPages';
import ProfilePage from './pages/student/ProfilePage';
import LandingPage from './pages/LandingPage';
import CoursesStorePage from './pages/CoursesStorePage';
import SimulatorsPage from './pages/student/SimulatorsPage';

const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
    <div style={{width:44,height:44,border:'4px solid #E8EDF5',borderTopColor:'var(--coral)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
  </div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace/>;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage/>}/>
          <Route path="/register" element={<RegisterPage/>}/>
          <Route path="/"         element={<LandingPage/>}/>

          <Route path="/dashboard" element={<Guard><DashboardPage/></Guard>}/>

          <Route path="/catalog"                         element={<CatalogPage/>}/>
          <Route path="/store"                           element={<CoursesStorePage/>}/>
          <Route path="/courses/:id/buy"                 element={<CoursePurchasePage/>}/>
          <Route path="/courses/:id"                     element={<Guard><CourseDetailPage/></Guard>}/>
          <Route path="/courses/:courseId/lessons/:lessonId" element={<Guard><LessonPage/></Guard>}/>
          <Route path="/my-courses"                      element={<Guard roles={['student']}><DashboardPage/></Guard>}/>
          <Route path="/my-homework"                     element={<Guard roles={['student']}><MyHomeworkPage/></Guard>}/>
          <Route path="/my-orders"                       element={<Guard roles={['student']}><MyOrdersPage/></Guard>}/>

          <Route path="/homework/:courseId"              element={<Guard roles={['teacher','admin']}><HomeworkPage/></Guard>}/>
          <Route path="/homework"                        element={<Guard roles={['teacher','admin']}><HomeworkPage/></Guard>}/>
          <Route path="/stats/:id"                       element={<Guard roles={['teacher','admin']}><CourseStatsPage/></Guard>}/>

          <Route path="/admin/users"                     element={<Guard roles={['admin']}><AdminUsersPage/></Guard>}/>
          <Route path="/admin/courses"                   element={<Guard roles={['admin']}><AdminCoursesPage/></Guard>}/>
          <Route path="/admin/orders"                    element={<Guard roles={['admin']}><AdminOrdersPage/></Guard>}/>

          <Route path="/profile"      element={<Guard><ProfilePage/></Guard>}/>
          <Route path="/simulators"    element={<Guard><SimulatorsPage/></Guard>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
