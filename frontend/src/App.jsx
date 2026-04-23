import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/common/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import InstitutionPage from './pages/InstitutionPage'
import EmployerPage from './pages/EmployerPage'
import AdminPage from './pages/AdminPage'
import PublicVerifyPage from './pages/PublicVerifyPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminRequestsPage from './pages/AdminRequestsPage'
import TemplateDesignerPage from './pages/TemplateDesignerPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import CertificateSearchPage from './pages/CertificateSearchPage'


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-public" element={<PublicVerifyPage />} />
          <Route path="/verify/:certificateId" element={<PublicVerifyPage />} />
          <Route path="/search" element={<CertificateSearchPage />} />

          <Route path="/change-password" element={
            <ProtectedRoute roles={['admin', 'institution', 'employer']}>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />
          <Route path="/institution" element={
            <ProtectedRoute roles={['institution']}>
              <InstitutionPage />
            </ProtectedRoute>
          } />
          <Route path="/employer" element={
            <ProtectedRoute roles={['employer']}>
              <EmployerPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute roles={['admin']}>
              <AdminRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute roles={['admin', 'institution']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/template-designer" element={
            <ProtectedRoute roles={['institution']}>
              <TemplateDesignerPage />
            </ProtectedRoute>
          } />
          

        </Routes>
      </ErrorBoundary>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}