import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { Flame, Medal } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'

export default function Leaderboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [period, setPeriod] = useState<'week' | 'all'>('week')

  const { data: entries, isLoading } = trpc.leaderboard.top.useQuery({ period, limit: 20 })
  const { data: myRank } = trpc.leaderboard.myRank.useQuery(undefined, {
    enabled: !!user && user.creatorMode,
  })

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Medal size={24} className="text-yellow-400" />
    if (rank === 2) return <Medal size={24} className="text-gray-300" />
    if (rank === 3) return <Medal size={24} className="text-amber-600" />
    return <span className="text-lg font-semibold text-[#AFAFAF] w-6 text-center">{rank}</span>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
          Leaderboard
        </h1>
        <p className="text-sm text-[#AFAFAF] mb-4">Top-rated AI avatars this week</p>

        {/* Period toggle */}
        <div className="glass-card rounded-full p-1 flex h-10">
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 rounded-full text-sm font-medium transition-all ${
              period === 'week'
                ? 'bg-[#F04F51] text-white'
                : 'text-[#AFAFAF]'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`flex-1 rounded-full text-sm font-medium transition-all ${
              period === 'all'
                ? 'bg-[#F04F51] text-white'
                : 'text-[#AFAFAF]'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-4">
        {isLoading ? (
          <div className="space-y-3 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-3 mt-2">
            {entries.map((entry) => (
              <button
                key={entry.creatorId}
                onClick={() => navigate(`/creator/${entry.creatorHandle}`)}
                className="w-full glass-card rounded-2xl p-3 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-8 flex justify-center shrink-0">
                  {getRankDisplay(entry.rank)}
                </div>
                <img
                  src={entry.imageUrl}
                  alt={entry.creatorName}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{entry.creatorName}</p>
                  <p className="text-xs text-[#AFAFAF] flex items-center gap-1">
                    <Flame size={12} className="text-orange-500" />
                    {entry.fireVotes} fire
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-[#F04F51]" style={{ fontFamily: 'Outfit' }}>
                    {entry.score}
                  </p>
                  <p className="text-[10px] text-[#AFAFAF]">Score</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Flame size={48} className="text-[#AFAFAF] mb-4" />
            <p className="text-[#AFAFAF]">No rankings yet</p>
          </div>
        )}
      </div>

      {/* My rank */}
      {myRank && (
        <div className="shrink-0 px-5 pb-4">
          <div className="rounded-2xl p-4 border border-[#F04F51]/30 bg-[#F04F51]/5">
            <p className="text-[10px] text-[#F04F51] font-medium mb-1">YOUR RANK</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>
                  #{myRank.rank}
                </span>
              </div>
              <span className="text-lg font-semibold text-[#F04F51]" style={{ fontFamily: 'Outfit' }}>
                {myRank.score}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
