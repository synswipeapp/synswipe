import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Mail, Check } from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  const verifyMutation = trpc.localAuth.verifyEmail.useMutation({
    onSuccess: () => {
      setVerified(true)
      setTimeout(() => {
        window.location.href = '/discover'
      }, 2000)
    },
    onError: (err) => setError(err.message),
  })

  const resendMutation = trpc.localAuth.resendVerification.useMutation({
    onSuccess: () => {
      setError('')
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('Enter the 6-character code')
      return
    }
    verifyMutation.mutate({ code })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col px-6 py-8"
    >
      <button
        onClick={() => navigate('/discover')}
        className="w-10 h-10 rounded-full glass-card flex items-center justify-center mb-6 active:scale-95 transition-transform"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        {verified ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-4"
            >
              <Check size={32} className="text-[#4ADE80]" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              Email Verified!
            </h1>
            <p className="text-sm text-[#AFAFAF]">Redirecting to discover...</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F04F51]/10 flex items-center justify-center mb-4">
              <Mail size={28} className="text-[#F04F51]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              Verify Your Email
            </h1>
            <p className="text-sm text-[#AFAFAF] mb-6">
              Enter the 6-character verification code. Check your email or look at the console output.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full h-14 glass-card rounded-xl px-4 text-white text-lg text-center tracking-[0.5em] font-bold placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
                style={{ fontFamily: 'Outfit' }}
              />

              {error && <p className="text-sm text-[#EF4444]">{error}</p>}

              <button
                type="submit"
                disabled={verifyMutation.isPending}
                className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base disabled:opacity-40 active:scale-95 transition-transform"
                style={{ fontFamily: 'Outfit' }}
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                className="w-full text-center text-sm text-[#F04F51] disabled:opacity-50"
              >
                {resendMutation.isPending ? 'Sending...' : 'Resend Code'}
              </button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  )
}
