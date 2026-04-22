import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import {
  ArrowLeft, Users, Image, Star, MessageSquare, Flag,
  CreditCard, AlertTriangle, CheckCircle, Eye, EyeOff, Trash2
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'

export default function Admin() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'avatars' | 'users'>('overview')

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin })
  const { data: reports } = trpc.admin.reports.useQuery(undefined, { enabled: isAdmin && activeTab === 'reports' })
  const { data: allAvatars } = trpc.admin.avatars.useQuery(undefined, { enabled: isAdmin && activeTab === 'avatars' })
  const { data: allUsers } = trpc.admin.users.useQuery(undefined, { enabled: isAdmin && activeTab === 'users' })

  const utils = trpc.useUtils()
  const updateReport = trpc.admin.updateReport.useMutation({ onSuccess: () => utils.admin.reports.invalidate() })
  const toggleAvatar = trpc.admin.toggleAvatarPublic.useMutation({ onSuccess: () => utils.admin.avatars.invalidate() })
  const deleteAvatar = trpc.admin.deleteAvatar.useMutation({ onSuccess: () => { utils.admin.avatars.invalidate(); utils.admin.stats.invalidate(); } })

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <AlertTriangle size={48} className="text-[#EF4444] mb-4" />
        <p className="text-white font-semibold mb-2">Admin Access Required</p>
        <p className="text-sm text-[#AFAFAF] text-center mb-6">You need admin privileges to access this page.</p>
        <button onClick={() => navigate('/discover')} className="h-12 bg-[#F04F51] text-white font-bold rounded-full px-8">
          Go Home
        </button>
      </div>
    )
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Star },
    { key: 'reports', label: 'Reports', icon: Flag },
    { key: 'avatars', label: 'Avatars', icon: Image },
    { key: 'users', label: 'Users', icon: Users },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Outfit' }}>
          Admin
        </h2>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-4 pb-2">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === t.key ? 'bg-[#F04F51] text-white' : 'glass-card text-[#AFAFAF]'
                }`}
              >
                <Icon size={14} />
                {t.label}
                {t.key === 'reports' && stats && stats.pendingReports > 0 && (
                  <span className="bg-[#EF4444] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{stats.pendingReports}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3">
        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Users', value: stats.totalUsers, icon: Users, color: '#60A5FA' },
              { label: 'Avatars', value: stats.totalAvatars, icon: Image, color: '#4ADE80' },
              { label: 'Ratings', value: stats.totalRatings, icon: Star, color: '#F04F51' },
              { label: 'Reviews', value: stats.totalReviews, icon: MessageSquare, color: '#FB6F87' },
              { label: 'Reports', value: stats.totalReports, icon: Flag, color: '#EF4444' },
              { label: 'Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: '#FBBF24' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="glass-card rounded-2xl p-4">
                  <Icon size={18} style={{ color: s.color }} className="mb-2" />
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{s.value}</p>
                  <p className="text-xs text-[#AFAFAF]">{s.label}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── REPORTS ─── */}
        {activeTab === 'reports' && reports && (
          <div className="space-y-2">
            {reports.length === 0 && <p className="text-sm text-[#AFAFAF] text-center py-8">No reports yet</p>}
            {reports.map((r) => (
              <div key={r.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    r.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                    r.status === 'dismissed' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {r.status?.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[#AFAFAF]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-sm text-white font-medium mb-1">{r.reason}</p>
                {r.details && <p className="text-xs text-[#AFAFAF] mb-3">{r.details}</p>}
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateReport.mutate({ id: r.id, status: 'resolved' })}
                      className="flex-1 h-8 bg-[#4ADE80] text-white text-xs font-bold rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={12} /> Resolve
                    </button>
                    <button
                      onClick={() => updateReport.mutate({ id: r.id, status: 'dismissed' })}
                      className="flex-1 h-8 glass-card text-[#AFAFAF] text-xs font-medium rounded-lg active:scale-95 transition-transform"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── AVATARS ─── */}
        {activeTab === 'avatars' && allAvatars && (
          <div className="space-y-2">
            {allAvatars.map((a) => (
              <div key={a.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                <img src={a.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{a.caption || 'Untitled'}</p>
                  <p className="text-[10px] text-[#AFAFAF]">{a.avatarStyle} · {a.isPublic ? 'Public' : 'Hidden'}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleAvatar.mutate({ id: a.id })}
                    className="w-8 h-8 rounded-full glass-card flex items-center justify-center active:scale-95"
                    title={a.isPublic ? 'Hide' : 'Show'}
                  >
                    {a.isPublic ? <Eye size={14} className="text-white" /> : <EyeOff size={14} className="text-[#AFAFAF]" />}
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this avatar?')) deleteAvatar.mutate({ id: a.id }) }}
                    className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center active:scale-95"
                  >
                    <Trash2 size={14} className="text-[#EF4444]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── USERS ─── */}
        {activeTab === 'users' && allUsers && (
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div key={`${u.source}-${u.id}`} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-white font-medium">{u.name || 'Unknown'}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#AFAFAF]">{u.source}</span>
                </div>
                <p className="text-xs text-[#AFAFAF]">@{u.handle}</p>
                {u.email && <p className="text-xs text-[#AFAFAF]">{u.email}</p>}
                <p className="text-[10px] text-[#AFAFAF] mt-1">
                  {u.creatorMode ? '👑 Creator' : '👤 User'} · {u.role}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
