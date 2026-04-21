import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Check, Crown, Sparkles, Zap, Globe, CreditCard } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'

const features = [
  'Upload unlimited avatars',
  'Appear in discover feed',
  'Add up to 4 social links',
  'Get ratings & reviews',
  'Track leaderboard rank',
  'Receive notifications',
  'AI avatar quality analysis',
  'Analytics dashboard',
]

export default function CreatorUpgrade() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [error, setError] = useState('')

  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: !!user,
  })

  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleSubscribe = () => {
    setError('')
    const successUrl = `${window.location.origin}/upgrade?success=true`
    const cancelUrl = `${window.location.origin}/upgrade?canceled=true`
    createCheckout.mutate({ successUrl, cancelUrl })
  }

  // Check URL params for Stripe redirect
  const urlParams = new URLSearchParams(window.location.search)
  const paymentSuccess = urlParams.get('success') === 'true'
  const paymentCanceled = urlParams.get('canceled') === 'true'

  if (subStatus?.isSubscribed || paymentSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mb-4"
        >
          <Crown size={28} className="text-[#4ADE80]" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
          You're a Creator!
        </h2>
        <p className="text-sm text-[#AFAFAF] text-center mb-6">
          Your creator subscription is active. You can upload avatars and get discovered.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="h-12 bg-[#F04F51] text-white font-bold rounded-full px-8 active:scale-95 transition-transform"
        >
          Upload Your First Avatar
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Outfit' }}>
          Creator Plan
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        {/* Payment canceled message */}
        {paymentCanceled && (
          <div className="glass-card rounded-xl p-4 mb-4 border border-yellow-500/30">
            <p className="text-sm text-yellow-400">Payment was canceled. You can try again anytime.</p>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-4 mb-4 border border-[#EF4444]/30">
            <p className="text-sm text-[#EF4444]">{error}</p>
          </div>
        )}

        {/* Hero */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F04F51] to-[#FB6F87] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#F04F51]/25">
            <Crown size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
            Go Creator
          </h1>
          <p className="text-sm text-[#AFAFAF]">
            Upload your avatars and get discovered by thousands
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(240, 79, 81, 0.15), rgba(251, 111, 135, 0.08))',
            border: '1px solid rgba(240, 79, 81, 0.25)',
          }}
        >
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>$6.99</span>
            <span className="text-[#AFAFAF]">/month</span>
          </div>
          <p className="text-xs text-[#AFAFAF] mb-4">Cancel anytime. No commitment.</p>

          {/* Features */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-[#4ADE80]/15 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-[#4ADE80]" />
                </div>
                <span className="text-sm text-white/90">{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits row */}
        <div className="flex justify-around mb-6">
          <div className="flex flex-col items-center gap-1">
            <Zap size={18} className="text-[#F04F51]" />
            <span className="text-[10px] text-[#AFAFAF]">Instant</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Globe size={18} className="text-[#60A5FA]" />
            <span className="text-[10px] text-[#AFAFAF]">Global reach</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Sparkles size={18} className="text-yellow-400" />
            <span className="text-[10px] text-[#AFAFAF]">AI powered</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="shrink-0 px-5 pb-5">
        <button
          onClick={handleSubscribe}
          disabled={createCheckout.isPending}
          className="w-full h-14 text-white font-bold rounded-2xl text-base disabled:opacity-40 active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
          style={{
            fontFamily: 'Outfit',
            background: 'linear-gradient(135deg, #F04F51, #FB6F87)',
          }}
        >
          <CreditCard size={18} />
          {createCheckout.isPending ? 'Loading...' : 'Subscribe with Stripe — $6.99/mo'}
        </button>
        <p className="text-center text-[10px] text-[#AFAFAF] mt-2">
          Secured by Stripe. You will be redirected to Stripe Checkout.
        </p>
      </div>
    </motion.div>
  )
}
