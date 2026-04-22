import { useToast } from '@/components/ToastProvider'

export function useShare() {
  const { showToast } = useToast()

  const shareProfile = async (handle: string, name?: string) => {
    const shareUrl = `${window.location.origin}/creator/${handle}`
    const shareText = `Check out ${name || handle}'s AI avatars on SynSwipe! Rate them 🔥 or ❄️`

    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name || handle} on SynSwipe`,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      showToast('Link copied to clipboard!', 'success')
    } catch {
      showToast('Could not copy link', 'warning')
    }
  }

  const shareApp = async () => {
    const shareUrl = window.location.origin
    const shareText = 'Rate AI avatars on SynSwipe! 🔥❄️ Discover amazing creators.'

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SynSwipe',
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // Fall through
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      showToast('Link copied to clipboard!', 'success')
    } catch {
      showToast('Could not copy link', 'warning')
    }
  }

  return { shareProfile, shareApp }
}
