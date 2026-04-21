import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, ExternalLink, Share2 } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

const platformIcons: Record<string, string> = {
  instagram: '📷',
  tiktok: '🎵',
  twitter: '🐦',
  youtube: '▶️',
  linktree: '🔗',
  website: '🌐',
}

export default function CreatorDetail() {
  const { handle } = useParams<{ handle: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  const { data: profile, isLoading } = trpc.creator.getProfile.useQuery(
    { handle: handle! },
    { enabled: !!handle },
  )

  const { data: reviews } = trpc.review.list.useQuery(
    { avatarId: profile?.avatars?.[0]?.id ?? 0, limit: 10 },
    { enabled: !!profile?.avatars?.[0]?.id },
  )

  const createReview = trpc.review.create.useMutation({
    onSuccess: () => {
      setShowReviewForm(false)
      setReviewRating(0)
      setReviewText('')
    },
  })

  const submitReview = () => {
    if (!profile?.avatars?.[0]?.id || reviewRating === 0) return
    createReview.mutate({
      avatarId: profile.avatars[0].id,
      rating: reviewRating,
      text: reviewText || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F04F51] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-[#AFAFAF]">Creator not found</p>
        <button onClick={() => navigate(-1)} className="text-[#F04F51] mt-4">Go Back</button>
      </div>
    )
  }

  const avatar = profile.avatars?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Hero */}
      <div className="relative shrink-0 h-[45%]">
        {avatar && (
          <img
            src={avatar.imageUrl}
            alt={profile.name ?? ''}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 gradient-overlay-top" />
        <div className="absolute inset-0 gradient-overlay-bottom" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: profile.name ?? '', url: window.location.href })
            }
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-95 transition-transform"
        >
          <Share2 size={18} className="text-white" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar -mt-6 relative">
        <div className="glass-card rounded-t-3xl px-5 pt-6 pb-8">
          {/* Profile header */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                {profile.name}
              </h2>
              <span className="bg-[#F04F51] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                AI Creator
              </span>
            </div>
            <p className="text-sm text-[#AFAFAF]">@{profile.handle}</p>
            {profile.bio && (
              <p className="text-sm text-[#D9D9D9] mt-2 leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-around py-4 border-y border-white/10 mb-5">
            <div className="text-center">
              <p className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                {profile.stats?.fireVotes ?? 0}
              </p>
              <p className="text-xs text-[#AFAFAF]">Fire Votes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                {profile.stats?.reviews ?? 0}
              </p>
              <p className="text-xs text-[#AFAFAF]">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-[#F04F51]" style={{ fontFamily: 'Outfit' }}>
                {profile.stats?.rating ?? 0}
              </p>
              <p className="text-xs text-[#AFAFAF]">Rating</p>
            </div>
          </div>

          {/* Social Links */}
          {profile.socialLinks && profile.socialLinks.length > 0 && (
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Outfit' }}>
                Find me on
              </h3>
              <div className="space-y-2">
                {profile.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                  >
                    <span className="text-xl">{platformIcons[link.platform] ?? '🔗'}</span>
                    <span className="flex-1 text-white font-medium text-sm">
                      {link.label || link.platform}
                    </span>
                    <ExternalLink size={16} className="text-[#AFAFAF]" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                Reviews
              </h3>
              {isAuthenticated && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-xs text-[#F04F51] font-medium"
                >
                  Write a Review
                </button>
              )}
            </div>

            {/* Review form */}
            {showReviewForm && (
              <div className="glass-card rounded-xl p-4 mb-4">
                <p className="text-sm text-white mb-2">Rate this avatar</p>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={star <= reviewRating ? 'text-[#F04F51] fill-[#F04F51]' : 'text-[#AFAFAF]'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review..."
                  className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-[#AFAFAF] resize-none focus:outline-none focus:border-[#F04F51]"
                />
                <button
                  onClick={submitReview}
                  disabled={reviewRating === 0 || createReview.isPending}
                  className="w-full mt-3 h-10 bg-[#F04F51] text-white font-bold rounded-full text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}

            {/* Review list */}
            {reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full bg-[#F04F51]/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-[#F04F51]">
                          {(review.reviewerName ?? 'A')[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">{review.reviewerName}</span>
                      <div className="flex ml-auto">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'text-[#F04F51] fill-[#F04F51]' : 'text-[#AFAFAF]'}
                          />
                        ))}
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-sm text-[#D9D9D9]">{review.text}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#AFAFAF] text-center py-4">No reviews yet</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
