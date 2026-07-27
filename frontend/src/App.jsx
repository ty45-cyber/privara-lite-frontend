import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './lib/auth'
import { ToastProvider }   from './components/Toast'
import Landing    from './pages/Landing'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Layout     from './components/Layout'
import Dashboard  from './pages/Dashboard'
import Payroll    from './pages/Payroll'
import Treasury   from './pages/Treasury'
import Governance from './pages/Governance'
import Audit      from './pages/Audit'

const PrivateRoute = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/login" replace />

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index             element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="payroll"    element={<Payroll />} />
            <Route path="treasury"   element={<Treasury />} />
            <Route path="governance" element={<Governance />} />
            <Route path="audit"      element={<Audit />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}