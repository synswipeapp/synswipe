import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, HelpCircle, Mail, MessageSquare, FileText, ExternalLink } from 'lucide-react'

export default function Support() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send to an API endpoint
    setSent(true)
    setSubject('')
    setMessage('')
  }

  const faqs = [
    { q: 'How does rating work?', a: 'Swipe right for FIRE or left for ICE, then rate 1-10. Your votes help creators rank on the leaderboard.' },
    { q: 'How do I become a creator?', a: 'Go to your Profile and tap "Go Creator." Subscribe for $6.99/month to upload avatars and get discovered.' },
    { q: 'How many avatars can I upload?', a: 'Creators can upload up to 20 avatars on the Creator plan.' },
    { q: 'Can I change my avatar style after uploading?', a: 'Not yet, but this feature is coming soon. For now, delete and re-upload with the correct style.' },
    { q: 'How do I add social links?', a: 'Go to Profile, tap "Edit Profile," then add up to 4 social media links to drive traffic to your pages.' },
    { q: 'How are rankings calculated?', a: 'Rankings use a composite score: fire votes (50%) + average rating (30%) + review count (20%).' },
  ]

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
          Help & Support
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => navigate('/terms')}
            className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <FileText size={20} className="text-[#F04F51]" />
            <span className="text-[10px] text-white font-medium">Terms</span>
          </button>
          <button
            onClick={() => navigate('/privacy')}
            className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <ShieldIcon />
            <span className="text-[10px] text-white font-medium">Privacy</span>
          </button>
          <button
            onClick={() => window.open('mailto:support@synswipe.app', '_blank')}
            className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <Mail size={20} className="text-[#60A5FA]" />
            <span className="text-[10px] text-white font-medium">Email</span>
          </button>
        </div>

        {/* Contact Form */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-[#F04F51]" />
            <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit' }}>Contact Us</h3>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
                <Mail size={24} className="text-[#4ADE80]" />
              </div>
              <p className="text-white font-medium text-sm mb-1">Message Sent!</p>
              <p className="text-xs text-[#AFAFAF]">We will get back to you within 24 hours.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-3 text-xs text-[#F04F51] font-medium"
              >
                Send another
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  required
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  required
                  rows={4}
                  className="w-full glass-card rounded-xl p-4 text-white text-sm placeholder:text-[#AFAFAF] resize-none focus:outline-none focus:border-[#F04F51]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-sm active:scale-95 transition-transform"
                style={{ fontFamily: 'Outfit' }}
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={18} className="text-[#F04F51]" />
            <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit' }}>FAQs</h3>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-sm text-white font-medium pr-4">{question}</span>
        <ExternalLink size={14} className={`text-[#AFAFAF] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4"
        >
          <p className="text-xs text-[#D9D9D9] leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F04F51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
