import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import {
  ArrowLeft, Eye, Flame, Snowflake, Star,
  TrendingUp, BarChart3
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'

export default function Analytics() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: stats, isLoading } = trpc.analytics.myStats.useQuery(undefined, {
    enabled: !!user,
  })

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-[#AFAFAF]">Sign in to view your analytics</p>
        <button onClick={() => navigate('/login')} className="mt-4 h-12 bg-[#F04F51] text-white font-bold rounded-full px-8">
          Sign In
        </button>
      </div>
    )
  }

  const maxViews = Math.max(...(stats?.dailyViews?.map((d) => d.count) ?? [1]), 1)

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Outfit' }}>Analytics</h2>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="glass-card rounded-2xl p-4 h-20" />)}
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="glass-card rounded-2xl p-4">
                <Eye size={18} className="text-[#60A5FA] mb-2" />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{stats.totalViews}</p>
                <p className="text-xs text-[#AFAFAF]">Total Views</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <Flame size={18} className="text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{stats.totalFire}</p>
                <p className="text-xs text-[#AFAFAF]">Fire Votes</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <Snowflake size={18} className="text-cyan-400 mb-2" />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{stats.totalIce}</p>
                <p className="text-xs text-[#AFAFAF]">Ice Votes</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <Star size={18} className="text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{stats.avgRating}</p>
                <p className="text-xs text-[#AFAFAF]">Avg Rating</p>
              </div>
            </div>

            {/* Fire Ratio */}
            {stats.totalFire + stats.totalIce > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#F04F51]" />
                    <p className="text-sm text-white font-medium" style={{ fontFamily: 'Outfit' }}>Fire Ratio</p>
                  </div>
                  <p className="text-sm text-orange-400 font-bold">{Math.round((stats.totalFire / (stats.totalFire + stats.totalIce)) * 100)}%</p>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((stats.totalFire / (stats.totalFire + stats.totalIce)) * 100)}%`,
                      background: 'linear-gradient(90deg, #F04F51, #FB6F87)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-orange-400">{stats.totalFire} 🔥</span>
                  <span className="text-[10px] text-cyan-400 flex items-center gap-0.5">{stats.totalIce} <Snowflake size={10} /></span>
                </div>
              </div>
            )}

            {/* Daily Views Chart */}
            {stats.dailyViews && stats.dailyViews.length > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-[#F04F51]" />
                  <p className="text-sm text-white font-medium" style={{ fontFamily: 'Outfit' }}>Last 7 Days</p>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {stats.dailyViews.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${Math.max((d.count / maxViews) * 80, 4)}px`,
                          background: d.count > 0 ? 'linear-gradient(to top, #F04F51, #FB6F87)' : 'rgba(255,255,255,0.05)',
                        }}
                      />
                      <span className="text-[9px] text-[#AFAFAF]">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Avatars */}
            {stats.topAvatars && stats.topAvatars.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-yellow-400" />
                  <p className="text-sm text-white font-medium" style={{ fontFamily: 'Outfit' }}>Top Performing</p>
                </div>
                <div className="space-y-2">
                  {stats.topAvatars.map((avatar, i) => (
                    <div key={avatar.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                      <span className="text-lg font-bold text-[#F04F51] w-6 text-center" style={{ fontFamily: 'Outfit' }}>#{i + 1}</span>
                      <img src={avatar.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{avatar.caption || 'Untitled'}</p>
                        <div className="flex gap-3 text-[10px] text-[#AFAFAF]">
                          <span>{avatar.fireVotes} 🔥</span>
                          <span>⭐ {avatar.avgRating}</span>
                          <span>{avatar.views} 👁</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.topAvatars.length === 0 && (
              <div className="text-center py-10">
                <BarChart3 size={40} className="text-[#AFAFAF] mx-auto mb-3" />
                <p className="text-sm text-[#AFAFAF]">Upload avatars to see analytics</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  )
}
