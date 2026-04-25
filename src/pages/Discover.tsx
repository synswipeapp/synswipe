import { useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { useNavigate } from 'react-router'
import { Bell, Flame, MessageCircle, Star, Flag } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import ReportModal from '@/components/ReportModal'

const SWIPE_THRESHOLD = 120

type StyleFilter = 'photorealistic' | 'animated' | 'all'

type Verdict = 'fire' | 'ice' | null

interface CardData {
  id: number
  imageUrl: string
  caption: string | null
  tags: string[] | null
  avatarStyle?: string
  creatorName: string | null
  creatorHandle: string | null
  creatorAvatar: string | null
  creatorBio: string | null
  fireVotes: number
  reviewCount: number
  socialLinks: { platform: string; url: string }[]
}

function AvatarCard({
  card,
  index,
  onSwipe,
  onReport,
  onViewSocials,
}: {
  card: CardData
  index: number
  onSwipe: (direction: 'left' | 'right') => void
  onReport?: () => void
  onViewSocials?: () => void
}) {
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-15, 15])
  const scale = useTransform(x, [-300, 0, 300], [0.9, 1, 0.9])
  const fireOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1])
  const iceOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0])
  const fireScale = useTransform(x, [0, 200], [0.5, 1.2])
  const iceScale = useTransform(x, [-200, 0], [1.2, 0.5])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('right')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left')
    }
  }

  const handleTap = () => {
    if (card.creatorHandle) {
      navigate(`/creator/${card.creatorHandle}`)
    }
  }

  return (
    <motion.div
      className="absolute inset-x-4 top-0 bottom-28 cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        scale,
        zIndex: 10 - index,
      }}
      drag={index === 0 ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: 0.9, y: 16 * index, opacity: 1 - index * 0.3 }}
      animate={{ scale: 1 - index * 0.05, y: 8 * index, opacity: 1 - index * 0.3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-[#272727]">
        {/* Image */}
        <img
          src={card.imageUrl}
          alt={card.creatorName ?? ''}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-[40%] gradient-overlay-top" />
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] gradient-overlay-bottom" />

        {/* AI Avatar badge + Style badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="glass-card px-2.5 py-1 rounded-lg text-xs font-medium text-white">
            AI Avatar
          </span>
          {card.avatarStyle && (
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background: card.avatarStyle === 'photorealistic'
                  ? 'rgba(74, 222, 128, 0.2)'
                  : 'rgba(96, 165, 250, 0.2)',
                color: card.avatarStyle === 'photorealistic'
                  ? '#4ADE80'
                  : '#60A5FA',
              }}
            >
              {card.avatarStyle === 'photorealistic' ? 'Realistic' : 'Animated'}
            </span>
          )}
        </div>

        {/* Verdict badges */}
        <motion.div
          className="absolute top-12 right-6 bg-orange-500/90 px-4 py-2 rounded-xl rotate-[-15deg] shadow-lg border-2 border-orange-400"
          style={{ opacity: fireOpacity, scale: fireScale }}
        >
          <span className="text-4xl">🔥</span>
        </motion.div>
        <motion.div
          className="absolute top-12 left-6 bg-cyan-500/90 px-4 py-2 rounded-xl rotate-[15deg] shadow-lg border-2 border-cyan-400"
          style={{ opacity: iceOpacity, scale: iceScale }}
        >
          <span className="text-4xl">🧊</span>
        </motion.div>

        {/* Creator avatar + Report */}
        <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
          {card.creatorAvatar && (
            <img
              src={card.creatorAvatar}
              alt={card.creatorName ?? ''}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
            />
          )}
        </div>

        {/* Report button */}
        {onReport && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReport()
            }}
            className="absolute top-16 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            <Flag size={14} className="text-white/70" />
          </button>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-2xl font-semibold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
            {card.creatorName}
          </h2>
          <p className="text-sm text-[#D9D9D9] line-clamp-1 mb-3">
            {card.creatorBio || card.caption}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-[#AFAFAF]">
              <span className="flex items-center gap-1">
                <Flame size={14} className="text-orange-500" />
                {card.fireVotes} fire
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={14} />
                {card.reviewCount} reviews
              </span>
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400" />
                4.8
              </span>
            </div>
            {card.socialLinks.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewSocials?.()
                }}
                className="px-3 py-1.5 rounded-xl bg-[#F04F51]/20 text-[#F04F51] text-xs font-medium active:scale-95 transition-transform"
              >
                View Socials
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function RatingSheet({
  isOpen,
  onClose,
  onSubmit,
  verdict,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number) => void
  verdict: Verdict
}) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const displayRating = hoverRating ?? selectedRating

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

            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{
                  background: verdict === 'fire'
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.15))'
                    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(8, 145, 178, 0.15))',
                  border: `2px solid ${verdict === 'fire' ? 'rgba(249, 115, 22, 0.5)' : 'rgba(6, 182, 212, 0.5)'}`,
                }}
              >
                <span className="text-3xl">{verdict === 'fire' ? '🔥' : '🧊'}</span>
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
                {verdict === 'fire' ? 'That\'s Fire!' : 'Ice Cold'}
              </h3>
              <p className="text-sm text-[#AFAFAF]">
                Rate this avatar 1–10
              </p>
            </div>

            {/* 1-10 Rating Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {Array.from({ length: 10 }).map((_, i) => {
                const num = i + 1
                const isSelected = selectedRating === num
                const isHovered = hoverRating === num
                const isActive = isSelected || isHovered

                return (
                  <motion.button
                    key={num}
                    onClick={() => setSelectedRating(num)}
                    onMouseEnter={() => setHoverRating(num)}
                    onMouseLeave={() => setHoverRating(null)}
                    whileTap={{ scale: 0.9 }}
                    className="aspect-square rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                    style={{
                      fontFamily: 'Outfit',
                      background: isActive
                        ? verdict === 'fire'
                          ? 'linear-gradient(135deg, #F04F51, #FB6F87)'
                          : 'linear-gradient(135deg, #06B6D4, #22D3EE)'
                        : 'rgba(255, 255, 255, 0.06)',
                      color: isActive ? 'white' : '#AFAFAF',
                      border: isActive
                        ? 'none'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {num}
                  </motion.button>
                )
              })}
            </div>

            {/* Rating description */}
            {displayRating && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-white/80 mb-4"
              >
                {displayRating <= 3 && 'Needs work'}
                {displayRating >= 4 && displayRating <= 6 && 'Pretty good'}
                {displayRating >= 7 && displayRating <= 8 && 'Great avatar'}
                {displayRating >= 9 && displayRating <= 10 && 'Absolutely incredible!'}
              </motion.p>
            )}

            {/* Submit */}
            <button
              onClick={() => selectedRating && onSubmit(selectedRating)}
              disabled={!selectedRating}
              className="w-full h-14 text-white font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.97] transition-transform"
              style={{
                fontFamily: 'Outfit',
                background: verdict === 'fire'
                  ? 'linear-gradient(135deg, #F04F51, #FB6F87)'
                  : 'linear-gradient(135deg, #06B6D4, #22D3EE)',
              }}
            >
              {selectedRating ? `Submit ${selectedRating}/10` : 'Select a rating'}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 h-12 text-[#AFAFAF] text-sm font-medium rounded-2xl active:scale-[0.97] transition-transform"
            >
              Skip rating
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SocialLinksSheet({
  isOpen,
  onClose,
  socialLinks,
  creatorName,
}: {
  isOpen: boolean
  onClose: () => void
  socialLinks: { platform: string; url: string }[]
  creatorName: string | null
}) {
  const platformColors: Record<string, string> = {
    twitter: '#1DA1F2',
    x: '#1DA1F2',
    instagram: '#E1306C',
    tiktok: '#FF0050',
    youtube: '#FF0000',
    twitch: '#9146FF',
    onlyfans: '#00AFF0',
    patreon: '#FF424D',
    linktree: '#43E660',
    website: '#AFAFAF',
    other: '#AFAFAF',
  }

  const platformIcons: Record<string, string> = {
    twitter: '𝕏',
    x: '𝕏',
    instagram: '📸',
    tiktok: '🎵',
    youtube: '▶️',
    twitch: '🎮',
    onlyfans: '👑',
    patreon: '⭐',
    linktree: '🌳',
    website: '🌐',
    other: '🔗',
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

            <h3
              className="text-xl font-bold text-white mb-1 text-center"
              style={{ fontFamily: 'Outfit' }}
            >
              {creatorName ? `${creatorName}'s Socials` : 'Creator Socials'}
            </h3>
            <p className="text-sm text-[#AFAFAF] text-center mb-5">
              Follow and support this creator
            </p>

            {socialLinks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[#AFAFAF] text-sm">No social links added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl glass-card active:scale-[0.97] transition-transform"
                    style={{
                      borderLeft: `3px solid ${platformColors[link.platform.toLowerCase()] || '#AFAFAF'}`,
                    }}
                  >
                    <span className="text-xl">{platformIcons[link.platform.toLowerCase()] || '🔗'}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium capitalize">{link.platform}</p>
                      <p className="text-[#AFAFAF] text-xs truncate">{link.url}</p>
                    </div>
                    <span className="text-[#F04F51] text-xs font-medium">Open ↗</span>
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-5 h-12 text-[#AFAFAF] text-sm font-medium rounded-2xl active:scale-[0.97] transition-transform glass-card"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Discover() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all')
  const [pendingVerdict, setPendingVerdict] = useState<Verdict>(null)
  const [pendingAvatarId, setPendingAvatarId] = useState<number | null>(null)
  const [showRatingSheet, setShowRatingSheet] = useState(false)
  const [showSocialSheet, setShowSocialSheet] = useState(false)
  const [activeSocialLinks, setActiveSocialLinks] = useState<{ platform: string; url: string }[]>([])
  const [activeCreatorName, setActiveCreatorName] = useState<string | null>(null)
  const [reportAvatarId, setReportAvatarId] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const { showToast } = useToast()
  const utils = trpc.useUtils()

  // Welcome toast on first visit after signup
  useEffect(() => {
    if (sessionStorage.getItem('show_welcome') === 'true') {
      showToast('Welcome to SynSwipe! Start swiping 🔥', 'success')
      sessionStorage.removeItem('show_welcome')
    }
  }, [showToast])

  const handleStyleChange = (s: StyleFilter) => {
    setStyleFilter(s)
    setCurrentIndex(0)
  }

  const { data: cards, isLoading } = trpc.avatar.discover.useQuery(
    { limit: 10, offset: 0, style: styleFilter }
  )
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const rateMutation = trpc.rating.submit.useMutation({
    onSuccess: () => {
      utils.avatar.discover.invalidate()
    },
  })

  const handleSwipe = useCallback(
    (swipeDir: 'left' | 'right') => {
      if (!cards || currentIndex >= cards.length) return

      const card = cards[currentIndex]
      const verdict = swipeDir === 'right' ? 'fire' : 'ice'

      if (isAuthenticated) {
        // For authenticated users, show the rating sheet first
        setPendingVerdict(verdict)
        setPendingAvatarId(card.id)
        setShowRatingSheet(true)
      } else {
        // Anonymous users just submit the verdict without rating
        rateMutation.mutate({
          avatarId: card.id,
          verdict,
        })
        setCurrentIndex((prev) => prev + 1)
      }
    },
    [cards, currentIndex, isAuthenticated, rateMutation],
  )

  const handleRatingSubmit = (ratingValue: number) => {
    if (pendingAvatarId && pendingVerdict) {
      rateMutation.mutate({
        avatarId: pendingAvatarId,
        verdict: pendingVerdict,
        ratingValue,
      })
    }
    setShowRatingSheet(false)
    setPendingVerdict(null)
    setPendingAvatarId(null)
    setCurrentIndex((prev) => prev + 1)
  }

  const handleSkipRating = () => {
    if (pendingAvatarId && pendingVerdict) {
      rateMutation.mutate({
        avatarId: pendingAvatarId,
        verdict: pendingVerdict,
      })
    }
    setShowRatingSheet(false)
    setPendingVerdict(null)
    setPendingAvatarId(null)
    setCurrentIndex((prev) => prev + 1)
  }

  const handleButtonPress = (btnDir: 'left' | 'right') => {
    handleSwipe(btnDir)
  }

  const visibleCards = cards?.slice(currentIndex, currentIndex + 3) ?? []

  const styles: { key: StyleFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'photorealistic', label: 'Realistic' },
    { key: 'animated', label: 'Animated' },
  ]

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-1">
        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
          SynSwipe
        </h1>
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95 transition-transform"
        >
          <Bell size={20} className="text-white" />
          {unreadCount && unreadCount.count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#EF4444] rounded-full border-2 border-[#1E1E1E]" />
          )}
        </button>
      </div>

      {/* Style Filter Toggle */}
      <div className="shrink-0 px-4 pb-2">
        <div className="glass-card rounded-full p-1 flex h-9">
          {styles.map((s) => (
            <button
              key={s.key}
              onClick={() => handleStyleChange(s.key)}
              className={`flex-1 rounded-full text-xs font-medium transition-all ${
                styleFilter === s.key
                  ? 'bg-[#F04F51] text-white'
                  : 'text-[#AFAFAF]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative mx-0">
        {isLoading ? (
          <div className="absolute inset-x-4 top-0 bottom-28 rounded-[20px] bg-[#272727] animate-pulse" />
        ) : visibleCards.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {visibleCards.map((card, i) => (
              <AvatarCard
                key={`${card.id}-${currentIndex}-${styleFilter}`}
                card={card}
                index={i}
                onSwipe={i === 0 ? handleSwipe : () => {}}
                onReport={i === 0 ? () => {
                  setReportAvatarId(card.id)
                  setShowReportModal(true)
                } : undefined}
                onViewSocials={i === 0 ? () => {
                  setActiveSocialLinks(card.socialLinks)
                  setActiveCreatorName(card.creatorName)
                  setShowSocialSheet(true)
                } : undefined}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="absolute inset-x-4 top-0 bottom-28 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center mb-4">
              <Flame size={36} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              No more avatars
            </h3>
            <p className="text-sm text-[#AFAFAF] text-center">
              {styleFilter === 'all'
                ? 'Check back later for new creators!'
                : `No ${styleFilter} avatars available right now.`}
            </p>
          </div>
        )}
      </div>

      {/* Fire/Ice Buttons */}
      <div className="shrink-0 px-6 pb-2 pt-1">
        <div className="flex items-center justify-center gap-28 h-16">
          <button
            onClick={() => handleButtonPress('left')}
            className="text-6xl active:scale-90 transition-transform"
            aria-label="Ice"
          >
            🧊
          </button>
          <button
            onClick={() => handleButtonPress('right')}
            className="text-6xl active:scale-90 transition-transform"
            aria-label="Fire"
          >
            🔥
          </button>
        </div>
        <p className="text-center text-[11px] text-[#AFAFAF] mt-2" style={{ fontFamily: 'Outfit' }}>
          Select 🔥 or 🧊, then rate this avatar
        </p>
      </div>

      {/* Rating Sheet */}
      <RatingSheet
        isOpen={showRatingSheet}
        onClose={handleSkipRating}
        onSubmit={handleRatingSubmit}
        verdict={pendingVerdict}
      />

      {/* Social Links Sheet */}
      <SocialLinksSheet
        isOpen={showSocialSheet}
        onClose={() => setShowSocialSheet(false)}
        socialLinks={activeSocialLinks}
        creatorName={activeCreatorName}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        avatarId={reportAvatarId ?? 0}
      />
    </div>
  )
}
