import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, X, Check } from 'lucide-react'
import { trpc } from '@/providers/trpc'

const reasons = [
  'Inappropriate content',
  'Not an AI avatar',
  'Spam or scam',
  'Harassment or bullying',
  'Copyright violation',
  'Other',
]

export default function ReportModal({
  isOpen,
  onClose,
  avatarId,
}: {
  isOpen: boolean
  onClose: () => void
  avatarId: number
}) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const createReport = trpc.report.create.useMutation({
    onSuccess: () => {
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelectedReason('')
        setDetails('')
        onClose()
      }, 2000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) return
    createReport.mutate({
      avatarId,
      reason: selectedReason,
      details: details || undefined,
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-end"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full bg-[#272727] rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            {submitted ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-14 h-14 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mb-3">
                  <Check size={24} className="text-[#4ADE80]" />
                </div>
                <p className="text-white font-semibold text-sm">Report Submitted</p>
                <p className="text-xs text-[#AFAFAF] mt-1">Thank you for helping keep SynSwipe safe.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flag size={18} className="text-[#EF4444]" />
                    <h3 className="text-white font-semibold" style={{ fontFamily: 'Outfit' }}>
                      Report Avatar
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full glass-card flex items-center justify-center"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <p className="text-xs text-[#AFAFAF] mb-3">Why are you reporting this?</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {reasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setSelectedReason(reason)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          selectedReason === reason
                            ? 'bg-[#F04F51] text-white'
                            : 'glass-card text-[#AFAFAF]'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Additional details (optional)"
                    rows={3}
                    className="w-full glass-card rounded-xl p-3 text-sm text-white placeholder:text-[#AFAFAF] resize-none focus:outline-none focus:border-[#F04F51] mb-4"
                  />

                  <button
                    type="submit"
                    disabled={!selectedReason || createReport.isPending}
                    className="w-full h-12 bg-[#EF4444] text-white font-bold rounded-2xl text-sm disabled:opacity-30 active:scale-95 transition-transform"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    {createReport.isPending ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
