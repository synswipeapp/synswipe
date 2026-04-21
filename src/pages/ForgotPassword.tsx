import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, KeyRound, Check } from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'request' | 'showToken'>('request')

  const requestReset = trpc.localAuth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      setToken(data.token)
      setStep('showToken')
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('Enter your username')
      return
    }
    requestReset.mutate({ username })
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
        {step === 'request' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F04F51]/10 flex items-center justify-center mb-4">
              <KeyRound size={28} className="text-[#F04F51]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              Reset Password
            </h1>
            <p className="text-sm text-[#AFAFAF] mb-6">
              Enter your username and we'll generate a reset code for you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
                />
              </div>

              {error && <p className="text-sm text-[#EF4444]">{error}</p>}

              <button
                type="submit"
                disabled={requestReset.isPending}
                className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base disabled:opacity-40 active:scale-95 transition-transform"
                style={{ fontFamily: 'Outfit' }}
              >
                {requestReset.isPending ? 'Generating...' : 'Get Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mb-4">
              <Check size={28} className="text-[#4ADE80]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              Here's Your Code
            </h1>
            <p className="text-sm text-[#AFAFAF] mb-6">
              Copy this code and use it on the reset page. It expires in 1 hour.
            </p>

            <div className="glass-card rounded-xl p-5 mb-6 text-center">
              <p className="text-xs text-[#AFAFAF] mb-2">Reset Code</p>
              <p className="text-3xl font-bold text-white tracking-widest" style={{ fontFamily: 'Outfit' }}>
                {token}
              </p>
            </div>

            <button
              onClick={() => navigate(`/reset-password?token=${token}`)}
              className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base active:scale-95 transition-transform"
              style={{ fontFamily: 'Outfit' }}
            >
              Go to Reset Page
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
