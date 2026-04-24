import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { X, Upload, Lightbulb } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

const PREDEFINED_TAGS = ['Realistic', 'Anime', '3D', 'Cyberpunk', 'Fantasy', 'Portrait', 'Full Body', 'Editorial']

export default function UploadAvatar() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: subStatus, isLoading: subLoading } = trpc.subscription.status.useQuery(undefined, {
    enabled: !!user,
  })

  // Redirect non-subscribers to upgrade page
  useEffect(() => {
    if (!subLoading && subStatus && !subStatus.isSubscribed) {
      navigate('/upgrade')
    }
  }, [subStatus, subLoading, navigate])
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [avatarStyle, setAvatarStyle] = useState<'photorealistic' | 'animated' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    overallScore: number
    categories: { name: string; score: number }[]
    tips: string[]
  } | null>(null)

  const uploadMutation = trpc.avatar.upload.useMutation({
    onSuccess: () => {
      utils.avatar.discover.invalidate()
      navigate('/profile')
    },
  })

  const uploadImage = trpc.upload.uploadImage.useMutation()

  const analyzeMutation = trpc.ai.analyzeAvatar.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data)
      setShowAnalysis(true)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!preview) return
    if (!avatarStyle) {
      showToast('Please select an avatar style: Photorealistic or Animated', 'warning')
      return
    }
    setIsUploading(true)

    try {
      // Upload image to server storage first
      const uploadResult = await uploadImage.mutateAsync({ imageData: preview })

      // Then create avatar record with the public URL
      await uploadMutation.mutateAsync({
        imageUrl: uploadResult.url,
        caption: caption || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        isPublic,
        avatarStyle,
      })
    } catch {
      setIsUploading(false)
    }
  }

  const handleAnalyze = () => {
    // In a real app, we'd use the uploaded avatar ID
    // For demo, we simulate with a placeholder
    if (!preview) return
    analyzeMutation.mutate({ avatarId: 1 })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
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
          <X size={20} className="text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Outfit' }}>
          Upload Avatar
        </h2>
        <div className="w-10" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        {/* Image Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-square rounded-[20px] flex flex-col items-center justify-center gap-3 transition-all ${
            preview
              ? 'border-0 overflow-hidden relative'
              : 'border-2 border-dashed border-white/20'
          }`}
        >
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1.5 rounded-full">
                <span className="text-xs text-white">Change</span>
              </div>
            </>
          ) : (
            <>
              <Upload size={40} className="text-[#AFAFAF]" />
              <p className="text-sm text-[#AFAFAF]">Tap to upload avatar</p>
              <p className="text-xs text-[#AFAFAF]">JPG or PNG, max 10MB</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </button>

        {/* AI Analyze button */}
        {preview && (
          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="w-full mt-3 h-10 border border-white/20 text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {analyzeMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb size={16} />
                Analyze with AI
              </>
            )}
          </button>
        )}

        {/* Caption */}
        <div className="mt-5">
          <label className="text-sm font-medium text-white mb-2 block" style={{ fontFamily: 'Outfit' }}>
            Caption
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe your avatar..."
            className="w-full h-14 glass-card rounded-xl px-4 text-white text-sm placeholder:text-[#AFAFAF] focus:outline-none focus:border-[#F04F51]"
          />
        </div>

        {/* Tags */}
        <div className="mt-5">
          <label className="text-sm font-medium text-white mb-2 block" style={{ fontFamily: 'Outfit' }}>
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-[#F04F51] text-white'
                    : 'glass-card text-[#AFAFAF]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar Style */}
        <div className="mt-5">
          <label className="text-sm font-medium text-white mb-2 block" style={{ fontFamily: 'Outfit' }}>
            Avatar Style <span className="text-[#EF4444]">*</span>
          </label>
          <p className="text-xs text-[#AFAFAF] mb-3">
            Required — select how your avatar was created
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAvatarStyle('photorealistic')}
              className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all border ${
                avatarStyle === 'photorealistic'
                  ? 'bg-[#F04F51] text-white border-[#F04F51]'
                  : 'glass-card text-[#AFAFAF] border-transparent'
              }`}
            >
              Photorealistic
            </button>
            <button
              onClick={() => setAvatarStyle('animated')}
              className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all border ${
                avatarStyle === 'animated'
                  ? 'bg-[#F04F51] text-white border-[#F04F51]'
                  : 'glass-card text-[#AFAFAF] border-transparent'
              }`}
            >
              Animated
            </button>
          </div>
        </div>

        {/* Visibility */}
        <div className="mt-5 glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Make Public</p>
            <p className="text-xs text-[#AFAFAF]">Allow others to discover and rate</p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{ backgroundColor: isPublic ? '#F04F51' : '#AFAFAF33' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform"
              style={{ transform: isPublic ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>

        {/* Spacer */}
        <div className="h-8" />
      </div>

      {/* Upload Button */}
      <div className="shrink-0 px-5 pb-5">
        <button
          onClick={handleUpload}
          disabled={!preview || isUploading}
          className="w-full h-12 bg-[#F04F51] text-white font-bold rounded-full text-base disabled:opacity-40 active:scale-95 transition-transform"
          style={{ fontFamily: 'Outfit' }}
        >
          {isUploading ? 'Uploading...' : 'Upload Avatar'}
        </button>
      </div>

      {/* AI Analysis Bottom Sheet */}
      {showAnalysis && analysisResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex items-end"
          onClick={() => setShowAnalysis(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full bg-[#272727] rounded-t-3xl p-6 max-h-[70%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
              AI Analysis
            </h2>

            {/* Overall Score */}
            <div className="flex items-baseline gap-2 my-4">
              <span className="text-5xl font-bold text-[#F04F51]" style={{ fontFamily: 'Outfit' }}>
                {analysisResult.overallScore}
              </span>
              <span className="text-xl text-[#AFAFAF]">/100</span>
              <span className="text-sm text-[#AFAFAF] ml-2">Quality Score</span>
            </div>

            {/* Category Scores */}
            <div className="space-y-3 mb-5">
              {analysisResult.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">{cat.name}</span>
                    <span className="text-sm text-[#F04F51] font-medium">{cat.score}</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.score}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-[#F04F51] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-[#F04F51]" />
                <span className="text-sm font-medium text-white">Tips</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-[#D9D9D9] leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowAnalysis(false)}
              className="w-full mt-4 h-12 border border-white/20 text-white font-medium rounded-full active:scale-95 transition-transform"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
