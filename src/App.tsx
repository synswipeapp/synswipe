import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import Welcome from './pages/Welcome'
import Discover from './pages/Discover'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import CreatorDetail from './pages/CreatorDetail'
import UploadAvatar from './pages/UploadAvatar'
import CreatorUpgrade from './pages/CreatorUpgrade'
import Settings from './pages/Settings'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Support from './pages/Support'
import Notifications from './pages/Notifications'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import BottomNav from './components/BottomNav'
import { ToastProvider } from './components/ToastProvider'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const showNav = isAuthenticated && 
    !location.pathname.startsWith('/creator/') && 
    location.pathname !== '/upload' && 
    location.pathname !== '/login' &&
    location.pathname !== '/settings' &&
    location.pathname !== '/terms' &&
    location.pathname !== '/privacy' &&
    location.pathname !== '/support' &&
    location.pathname !== '/notifications'

  return (
    <ToastProvider>
      <div className="h-screen w-full bg-[#1E1E1E] flex justify-center">
        <div className="w-full max-w-md h-full relative flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Welcome />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/creator/:handle" element={<CreatorDetail />} />
              <Route path="/upload" element={<UploadAvatar />} />
              <Route path="/upgrade" element={<CreatorUpgrade />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Routes>
          </AnimatePresence>
          {showNav && <BottomNav />}
        </div>
      </div>
    </ToastProvider>
  )
}
