import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetPassword = trpc.localAuth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true)
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token.trim()) {
      setError('Enter the reset code')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    resetPassword.mutate({ token, newPassword })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col px-6 py-8"
    >
      <button
        onClick={() => navigate('/login')}
        className="w-10 h-10 rounded-full glass-card flex items-center justify-center mb-6 active:scale-95 transition-transform"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-[#4ADE80]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              Password Updated!
            </h1>
            <p className="text-sm text-[#AFAFAF] mb-6">
              Your password has been reset. Sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base active:scale-95 transition-transform"
              style={{ fontFamily: 'Outfit' }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F04F51]/10 flex items-center justify-center mb-4">
              <Lock size={28} className="text-[#F04F51]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              New Password
            </h1>
            <p className="text-sm text-[#AFAFAF] mb-6">
              Enter your reset code and choose a new password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">Reset Code</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD34"
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF]/50 focus:outline-none focus:border-[#F04F51] tracking-widest"
                />
              </div>

              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-12 glass-card rounded-xl px-4 pr-12 text-white text-sm placeholder:text-[#AFAFAF]/50 focus:outline-none focus:border-[#F04F51]"
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

              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF]/50 focus:outline-none focus:border-[#F04F51]"
                />
              </div>

              {error && <p className="text-sm text-[#EF4444]">{error}</p>}

              <button
                type="submit"
                disabled={resetPassword.isPending}
                className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base disabled:opacity-40 active:scale-95 transition-transform"
                style={{ fontFamily: 'Outfit' }}
              >
                {resetPassword.isPending ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  )
}
