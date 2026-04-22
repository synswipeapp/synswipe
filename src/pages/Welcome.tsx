import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router'
import { Zap, Users, Link2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const features = [
  { icon: Zap, title: 'Swipe & Rate', subtitle: 'Fire or ice — your vote counts' },
  { icon: Users, title: 'Discover Creators', subtitle: 'Find amazing AI avatar artists' },
  { icon: Link2, title: 'Connect', subtitle: 'Follow creators on their socials' },
]

function FloatingParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-[#F04F51]/40"
      style={{ left: `${x}%`, bottom: '-5%' }}
      animate={{
        y: [0, -800],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0.3],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  )
}

function SwipePreviewCard() {
  return (
    <motion.div
      className="absolute top-[15%] right-4 w-[100px]"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 0.85, x: 0 }}
      transition={{ delay: 1.6, duration: 0.6, type: 'spring' }}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
        <img src="/preview-card.jpg" alt="" className="w-full aspect-[3/4] object-cover" />
        <div className="absolute top-2 right-2 bg-orange-500 p-1.5 rounded-lg rotate-[-12deg] shadow-lg">
          <span className="text-white text-sm">🔥</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    </motion.div>
  )
}

export default function Welcome() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(t)
  }, [])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/discover')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background image - contained to show full avatar */}
      <div className="absolute inset-0 bg-[#1E1E1E]">
        <motion.img
          src="/user-avatar.jpg"
          alt=""
          className="w-full h-full object-contain object-top"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
        />
      </div>

      {/* Dark overlay gradients for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-[#1E1E1E]/50 to-transparent" style={{ top: '30%' }} />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.7} x={10 + (i * 7) % 80} />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 150px 40px rgba(0,0,0,0.5)' }}
      />

      {/* Swipe preview card */}
      <SwipePreviewCard />

      {/* Content */}
      <AnimatePresence>
        {showContent && (
          <div className="relative z-10 flex flex-col h-full justify-end px-6 pb-10">
            {/* Social proof pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex justify-center mb-5"
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(240, 79, 81, 0.15)',
                  border: '1px solid rgba(240, 79, 81, 0.25)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex -space-x-2">
                  <img src="/avatars/avatar-2.jpg" className="w-5 h-5 rounded-full border border-[#1E1E1E] object-cover" alt="" />
                  <img src="/avatars/avatar-3.jpg" className="w-5 h-5 rounded-full border border-[#1E1E1E] object-cover" alt="" />
                  <img src="/avatars/avatar-4.jpg" className="w-5 h-5 rounded-full border border-[#1E1E1E] object-cover" alt="" />
                </div>
                <span className="text-xs text-white/80 font-medium">Join 2,400+ creators</span>
              </div>
            </motion.div>

            {/* Logo */}
            <div className="mb-5">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4, type: 'spring' }}
              >
                <h1
                  className="text-6xl font-bold tracking-tight text-center"
                  style={{
                    fontFamily: 'Outfit',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F04F51 50%, #FB6F87 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 4px 20px rgba(240, 79, 81, 0.3))',
                  }}
                >
                  {'SynSwipe'.split('').map((letter, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="text-sm text-white/60 mt-2 text-center tracking-wide"
              >
                Rate AI avatars. Discover creators. Go viral.
              </motion.p>
            </div>

            {/* Feature cards */}
            <div className="space-y-2 mb-8">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + i * 0.12, duration: 0.5, type: 'spring' }}
                    className="rounded-2xl p-3 flex items-center gap-3.5"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(240, 79, 81, 0.25), rgba(251, 111, 135, 0.15))' }}
                    >
                      <Icon size={18} className="text-[#F04F51]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit' }}>
                        {feature.title}
                      </h3>
                      <p className="text-white/50 text-xs">{feature.subtitle}</p>
                    </div>
                    <ChevronRight size={14} className="text-white/30" />
                  </motion.div>
                )
              })}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="space-y-3"
            >
              <motion.button
                onClick={handleGetStarted}
                className="relative w-full h-14 text-white font-bold rounded-2xl text-base active:scale-[0.97] transition-transform overflow-hidden"
                style={{
                  fontFamily: 'Outfit',
                  background: 'linear-gradient(135deg, #F04F51, #FB6F87)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight size={18} />
                  </motion.span>
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/login')}
                className="w-full text-center text-sm text-white/50 active:text-white/80 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                Already have an account?{' '}
                <span className="text-[#F04F51] font-medium">Sign In</span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
