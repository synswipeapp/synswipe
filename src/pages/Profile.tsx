import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Camera, ToggleLeft, ToggleRight, Flame, Eye, Star, MousePointer,
  Plus, Trash2, LogOut, ChevronRight, Crown, BarChart3, Share2, Shield,
  Pencil, X
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useShare } from '@/hooks/useShare'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const utils = trpc.useUtils()

  const [editAvatarId, setEditAvatarId] = useState<number | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editStyle, setEditStyle] = useState<'photorealistic' | 'animated'>('photorealistic')
  const [showEditSheet, setShowEditSheet] = useState(false)

  const { data: stats } = trpc.creator.getStats.useQuery(undefined, {
    enabled: !!user,
  })

  const { data: creatorProfile } = trpc.creator.getProfile.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user },
  )

  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: !!user,
  })

  const updateProfile = trpc.creator.updateProfile.useMutation({
    onSuccess: () => {
      utils.creator.getProfile.invalidate()
      utils.creator.getStats.invalidate()
    },
  })

  const deleteAvatar = trpc.avatar.delete.useMutation({
    onSuccess: () => {
      utils.creator.getProfile.invalidate()
    },
  })

  const editAvatar = trpc.avatar.editAvatar.useMutation({
    onSuccess: () => {
      utils.creator.getProfile.invalidate()
      setShowEditSheet(false)
      setEditAvatarId(null)
    },
  })

  const handleToggleCreatorMode = () => {
    updateProfile.mutate({ creatorMode: !user?.creatorMode })
  }

  const openEditSheet = (avatar: { id: number; caption: string | null; avatarStyle: string }) => {
    setEditAvatarId(avatar.id)
    setEditCaption(avatar.caption ?? '')
    setEditStyle(avatar.avatarStyle as 'photorealistic' | 'animated')
    setShowEditSheet(true)
  }

  const handleDeleteAvatar = (id: number) => {
    if (confirm('Delete this avatar?')) {
      deleteAvatar.mutate({ id })
    }
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <p className="text-[#AFAFAF] mb-4">Sign in to view your profile</p>
        <button
          onClick={() => navigate('/login')}
          className="h-12 bg-[#F04F51] text-white font-bold rounded-full px-8 active:scale-95 transition-transform"
        >
          Sign In
        </button>
      </div>
    )
  }

  const { shareProfile } = useShare()

  const menuItems = [
    { label: 'Edit Profile', icon: Camera, action: () => navigate('/settings') },
    { label: 'Notifications', icon: Eye, action: () => navigate('/notifications') },
    { label: 'Analytics', icon: BarChart3, action: () => navigate('/analytics') },
    { label: 'Share Profile', icon: Share2, action: () => { if (user?.handle) shareProfile(user.handle, user.name) } },
    { label: 'Help & Support', icon: ChevronRight, action: () => navigate('/support') },
    ...(isAdmin ? [{ label: 'Admin Dashboard', icon: Shield, action: () => navigate('/admin') }] : []),
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Profile Header */}
        <div className="px-5 pt-5 pb-4 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative mb-3"
          >
            <img
              src={user.avatar ?? '/avatars/avatar-1.jpg'}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#F04F51]/30"
            />
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#F04F51] flex items-center justify-center">
              <Camera size={14} className="text-white" />
            </button>
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              {user.name}
            </h2>
            {subStatus?.isSubscribed && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-[#F04F51] to-[#FB6F87] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Crown size={10} />
                CREATOR
              </span>
            )}
          </motion.div>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-[#AFAFAF]"
          >
            @{user.handle || 'user'}
          </motion.p>

          {/* Creator Mode Toggle */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full glass-card rounded-2xl p-4 mt-4 flex items-center justify-between"
          >
            <div>
              <p className="text-white font-medium text-sm">Creator Mode</p>
              <p className="text-xs text-[#AFAFAF]">Show your avatar to the world</p>
            </div>
            <button onClick={handleToggleCreatorMode} className="active:scale-95 transition-transform">
              {user.creatorMode ? (
                <ToggleRight size={36} className="text-[#F04F51]" />
              ) : (
                <ToggleLeft size={36} className="text-[#AFAFAF]" />
              )}
            </button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="px-5 grid grid-cols-2 gap-3 mb-5"
        >
          <div className="glass-card rounded-2xl p-4 text-center">
            <Flame size={20} className="text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              {stats?.fireVotes ?? 0}
            </p>
            <p className="text-xs text-[#AFAFAF]">Fire Votes</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <Eye size={20} className="text-[#60A5FA] mx-auto mb-1" />
            <p className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              {stats?.profileViews ?? 0}
            </p>
            <p className="text-xs text-[#AFAFAF]">Profile Views</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <Star size={20} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              {stats?.avgRating ?? 0}
            </p>
            <p className="text-xs text-[#AFAFAF]">Avg Rating</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <MousePointer size={20} className="text-[#4ADE80] mx-auto mb-1" />
            <p className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              {stats?.linkClicks ?? 0}
            </p>
            <p className="text-xs text-[#AFAFAF]">Link Clicks</p>
          </div>
        </motion.div>

        {/* Upgrade Prompt — non-subscribed creators */}
        {!subStatus?.isSubscribed && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="px-5 mb-5"
          >
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full rounded-2xl p-5 text-left relative overflow-hidden active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(240, 79, 81, 0.15), rgba(251, 111, 135, 0.08))',
                border: '1px solid rgba(240, 79, 81, 0.25)',
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F04F51] to-[#FB6F87] flex items-center justify-center shrink-0 shadow-lg shadow-[#F04F51]/20">
                  <Crown size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm mb-1" style={{ fontFamily: 'Outfit' }}>
                    Go Creator
                  </h3>
                  <p className="text-xs text-white/60 mb-2">
                    Upload avatars, get discovered, and drive traffic to your socials
                  </p>
                  <span className="text-[#F04F51] text-xs font-bold">$6.99/month →</span>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* My Avatars */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              My Avatars
            </h3>
            <button
              onClick={() => {
                if (subStatus?.isSubscribed) {
                  navigate('/upload')
                } else {
                  navigate('/upgrade')
                }
              }}
              className="text-sm text-[#F04F51] font-medium"
            >
              {subStatus?.isSubscribed ? 'Upload' : 'Upgrade to Upload'}
            </button>
          </div>

          {creatorProfile?.avatars && creatorProfile.avatars.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {creatorProfile.avatars.map((avatar) => (
                <div key={avatar.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img
                    src={avatar.imageUrl}
                    alt=""
                    className={`w-full h-full object-cover ${!avatar.isApproved ? 'opacity-60' : ''}`}
                  />
                  {!avatar.isApproved && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-lg bg-yellow-500/90 text-white text-xs font-bold">
                        Pending Approval
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => openEditSheet(avatar)}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil size={14} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleDeleteAvatar(avatar.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => {
                if (subStatus?.isSubscribed) {
                  navigate('/upload')
                } else {
                  navigate('/upgrade')
                }
              }}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {subStatus?.isSubscribed ? (
                <>
                  <Plus size={24} className="text-[#AFAFAF]" />
                  <span className="text-sm text-[#AFAFAF]">Upload your first avatar</span>
                </>
              ) : (
                <>
                  <Crown size={24} className="text-[#F04F51]" />
                  <span className="text-sm text-[#AFAFAF]">Creator plan required</span>
                  <span className="text-xs text-[#F04F51]">Upgrade for $6.99/mo</span>
                </>
              )}
            </button>
          )}
        </motion.div>

        {/* Settings Menu */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-5 mb-5"
        >
          <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Outfit' }}>
            Settings
          </h3>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
                >
                  <Icon size={18} className="text-[#AFAFAF]" />
                  <span className="flex-1 text-white text-sm">{item.label}</span>
                  <ChevronRight size={16} className="text-[#AFAFAF]" />
                </button>
              )
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
            >
              <LogOut size={18} className="text-[#EF4444]" />
              <span className="flex-1 text-[#EF4444] text-sm">Log Out</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Edit Avatar Sheet */}
      {showEditSheet && editAvatarId && (
        <div className="absolute inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditSheet(false)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full bg-[#272727] rounded-t-3xl p-6"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>
                Edit Avatar
              </h3>
              <button onClick={() => setShowEditSheet(false)}>
                <X size={20} className="text-[#AFAFAF]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">Caption</label>
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Describe your avatar..."
                  className="w-full h-12 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF]/50 focus:outline-none focus:border-[#F04F51]"
                />
              </div>

              <div>
                <label className="text-xs text-[#AFAFAF] mb-1.5 block">Style</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditStyle('photorealistic')}
                    className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all border ${
                      editStyle === 'photorealistic'
                        ? 'bg-[#F04F51] text-white border-[#F04F51]'
                        : 'glass-card text-[#AFAFAF] border-transparent'
                    }`}
                  >
                    Photorealistic
                  </button>
                  <button
                    onClick={() => setEditStyle('animated')}
                    className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all border ${
                      editStyle === 'animated'
                        ? 'bg-[#F04F51] text-white border-[#F04F51]'
                        : 'glass-card text-[#AFAFAF] border-transparent'
                    }`}
                  >
                    Animated
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  editAvatar.mutate({
                    id: editAvatarId,
                    caption: editCaption || undefined,
                    avatarStyle: editStyle,
                  })
                }}
                disabled={editAvatar.isPending}
                className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base disabled:opacity-40 active:scale-95 transition-transform"
                style={{ fontFamily: 'Outfit' }}
              >
                {editAvatar.isPending ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                onClick={() => setShowEditSheet(false)}
                className="w-full h-12 text-[#AFAFAF] font-medium rounded-full text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
