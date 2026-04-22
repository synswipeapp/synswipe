import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Shield } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()

  const sections = [
    {
      title: '1. Information We Collect',
      text: 'We collect: (a) account information (username, display name, email), (b) avatar images you upload, (c) ratings and reviews you submit, (d) social media links you add to your profile.',
    },
    {
      title: '2. How We Use Your Information',
      text: 'We use your information to: provide and improve the service, display your profile and avatars to other users, process subscription payments, send notifications about your account, and enforce our terms.',
    },
    {
      title: '3. Public Content',
      text: 'Your avatars, profile information, and social links are publicly visible to all users. Ratings you submit are associated with your account. Think carefully about what you share.',
    },
    {
      title: '4. Payments',
      text: 'All payments are processed through Stripe. We do not store your credit card information. Stripe handles all payment data in compliance with PCI-DSS standards.',
    },
    {
      title: '5. Data Storage',
      text: 'Your data is stored securely on our servers. We use industry-standard encryption for data in transit (HTTPS) and at rest.',
    },
    {
      title: '6. Data Sharing',
      text: 'We do not sell your personal information. We may share data with: Stripe (payment processing), service providers who help us operate the app, or when required by law.',
    },
    {
      title: '7. Your Rights',
      text: 'You have the right to: access your data, correct inaccurate information, delete your account and all associated data, and export your data.',
    },
    {
      title: '8. Cookies',
      text: 'We use minimal cookies for authentication and session management only. We do not use cookies for advertising or tracking purposes.',
    },
    {
      title: '9. Data Retention',
      text: 'We retain your data for as long as your account is active. When you delete your account, we remove your data within 30 days, except where we are legally required to retain it.',
    },
    {
      title: '10. Changes to This Policy',
      text: 'We may update this policy at any time. We will notify you of significant changes through the app or by email.',
    },
    {
      title: '11. Contact Us',
      text: 'For privacy-related questions or data requests, contact us through the Support page.',
    },
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
          Privacy Policy
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#F04F51]/10 flex items-center justify-center">
            <Shield size={20} className="text-[#F04F51]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit' }}>SynSwipe</p>
            <p className="text-xs text-[#AFAFAF]">Last updated: April 2026</p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="glass-card rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-1.5" style={{ fontFamily: 'Outfit' }}>
                {section.title}
              </h3>
              <p className="text-xs text-[#D9D9D9] leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
