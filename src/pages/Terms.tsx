import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Scale } from 'lucide-react'

export default function Terms() {
  const navigate = useNavigate()

  const sections = [
    {
      title: '1. Acceptance of Terms',
      text: 'By accessing or using SynSwipe, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.',
    },
    {
      title: '2. Eligibility',
      text: 'You must be at least 13 years old to use SynSwipe. By using the service, you represent and warrant that you meet this requirement.',
    },
    {
      title: '3. User Accounts',
      text: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.',
    },
    {
      title: '4. Creator Subscription',
      text: 'Creator features require a $6.99/month subscription. Subscriptions auto-renew until cancelled. You may cancel at any time through your account settings.',
    },
    {
      title: '5. Content Guidelines',
      text: 'You may only upload AI-generated avatars. All content must be appropriate for a general audience. Prohibited content includes: explicit sexual content, graphic violence, hate speech, harassment, and content that infringes on intellectual property rights.',
    },
    {
      title: '6. Reporting',
      text: 'Users may report inappropriate avatars. We reserve the right to remove any content that violates these terms without notice.',
    },
    {
      title: '7. Termination',
      text: 'We may suspend or terminate your account at any time for violations of these terms. You may also delete your account at any time through your settings.',
    },
    {
      title: '8. Limitation of Liability',
      text: 'SynSwipe is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.',
    },
    {
      title: '9. Changes to Terms',
      text: 'We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
    },
    {
      title: '10. Contact',
      text: 'For questions about these terms, contact us through the Support page.',
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
          Terms of Service
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#F04F51]/10 flex items-center justify-center">
            <Scale size={20} className="text-[#F04F51]" />
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
