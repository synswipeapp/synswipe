import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function Login() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('local_auth_token', data.token)
      utils.invalidate()
      navigate('/discover')
    },
    onError: (err) => setError(err.message),
  })

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('local_auth_token', data.token)
      utils.invalidate()
      // Store welcome flag for toast on next page
      sessionStorage.setItem('show_welcome', 'true')
      if (data.emailVerificationCode) {
        sessionStorage.setItem('verify_code', data.emailVerificationCode)
        navigate('/verify-email')
      } else {
        navigate('/discover')
      }
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (mode === 'login') {
      loginMutation.mutate({ username, password })
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      registerMutation.mutate({
        username,
        password,
        displayName: displayName || undefined,
        email: email || undefined,
      })
    }
  }

  const isSubmitting = loginMutation.isPending || registerMutation.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col px-6 py-8"
    >
      <button
        onClick={() => navigate('/')}
        className="w-10 h-10 rounded-full glass-card flex items-center justify-center mb-6 active:scale-95 transition-transform"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
          {mode === 'login' ? 'Welcome Back' : 'Get Started'}
        </h1>
        <p className="text-sm text-[#AFAFAF] mb-8">
          {mode === 'login'
            ? 'Sign in to continue rating avatars'
            : 'Create an account to start rating'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
                />
              </div>

              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block flex items-center gap-1">
                  <Mail size={12} />
                  Email <span className="text-[#AFAFAF]/50">(optional, for verification)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-[#AFAFAF] mb-1.5 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
            />
          </div>

          <div>
            <label className="text-xs text-[#AFAFAF] mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-12 glass-card rounded-xl px-4 pr-12 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AFAFAF]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#EF4444]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base disabled:opacity-40 active:scale-95 transition-transform"
            style={{ fontFamily: 'Outfit' }}
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full text-center text-xs text-[#F04F51] mt-4"
          >
            Forgot password?
          </button>
        )}
        <p className="text-center text-sm text-[#AFAFAF] mt-4">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError('') }} className="text-[#F04F51]">
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="text-[#F04F51]">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </motion.div>
  )
}
