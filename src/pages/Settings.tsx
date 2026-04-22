import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Lock, HelpCircle, Trash2, AlertTriangle } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const utils = trpc.useUtils()

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [handle, setHandle] = useState(user?.handle ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { showToast } = useToast()

  const updateProfile = trpc.creator.updateProfile.useMutation({
    onSuccess: () => {
      utils.creator.getProfile.invalidate()
      setIsSaving(false)
    },
  })

  const deleteAccount = trpc.localAuth.deleteAccount.useMutation({
    onSuccess: () => {
      localStorage.removeItem('local_auth_token')
      showToast('Your account has been deleted', 'success')
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    },
    onError: (err) => {
      showToast(err.message, 'warning')
    },
  })

  const handleSave = () => {
    setIsSaving(true)
    updateProfile.mutate({ name: name || undefined, bio: bio || undefined, handle: handle || undefined })
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
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Outfit' }}>
          Edit Profile
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-sm text-[#F04F51] font-medium disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-6 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={user?.avatar ?? '/avatars/avatar-1.jpg'}
            alt={user?.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-[#F04F51]/30 mb-2"
          />
          <button className="text-xs text-[#F04F51]">Change Photo</button>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-xs text-[#AFAFAF] mb-1.5 block">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 glass-card rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#F04F51]"
          />
        </div>

        {/* Username */}
        <div>
          <label className="text-xs text-[#AFAFAF] mb-1.5 block">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AFAFAF] text-sm">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full h-14 glass-card rounded-xl pl-8 pr-4 text-white text-sm focus:outline-none focus:border-[#F04F51]"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs text-[#AFAFAF] mb-1.5 block">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            className="w-full h-24 glass-card rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-[#F04F51]"
          />
          <p className="text-right text-xs text-[#AFAFAF] mt-1">{bio.length}/160</p>
        </div>

        {/* Menu items */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Outfit' }}>
            More
          </h3>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <Lock size={18} className="text-[#AFAFAF]" />
              <span className="flex-1 text-white text-sm">Privacy</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <HelpCircle size={18} className="text-[#AFAFAF]" />
              <span className="flex-1 text-white text-sm">Help & Support</span>
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="mt-8 mb-8">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-[#EF4444]/20 text-left active:bg-[#EF4444]/5 transition-colors"
            >
              <Trash2 size={18} className="text-[#EF4444]" />
              <div>
                <p className="text-sm text-[#EF4444] font-medium">Delete Account</p>
                <p className="text-xs text-[#AFAFAF]">Permanently remove all your data</p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 border border-[#EF4444]/30 bg-[#EF4444]/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-[#EF4444]" />
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit' }}>
                  Delete Your Account?
                </p>
              </div>
              <p className="text-xs text-[#AFAFAF] mb-4">
                This will permanently delete your account, all avatars, ratings, reviews, and social links. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-10 glass-card rounded-full text-sm text-white font-medium active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteAccount.mutate()}
                  disabled={deleteAccount.isPending}
                  className="flex-1 h-10 bg-[#EF4444] text-white rounded-full text-sm font-bold disabled:opacity-50 active:scale-95 transition-transform"
                  style={{ fontFamily: 'Outfit' }}
                >
                  {deleteAccount.isPending ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
