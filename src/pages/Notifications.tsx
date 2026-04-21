import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ArrowLeft, Flame, MessageCircle, Trophy, Bell } from 'lucide-react'
import { trpc } from '@/providers/trpc'

const typeConfig: Record<string, { icon: typeof Flame; bg: string; iconColor: string }> = {
  hot_vote: { icon: Flame, bg: 'bg-green-500/10', iconColor: 'text-green-400' },
  review: { icon: MessageCircle, bg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
  milestone: { icon: Trophy, bg: 'bg-[#F04F51]/10', iconColor: 'text-[#F04F51]' },
  system: { icon: Bell, bg: 'bg-gray-500/10', iconColor: 'text-gray-400' },
}

export default function Notifications() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const { data: notifications, isLoading } = trpc.notification.list.useQuery({ limit: 50 })
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  })
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate()
      utils.notification.unreadCount.invalidate()
    },
  })

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
          Notifications
        </h2>
        <button
          onClick={() => markAllRead.mutate()}
          className="text-xs text-[#F04F51] font-medium"
        >
          Mark All Read
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.system
              const Icon = config.icon
              return (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) markRead.mutate({ id: notif.id })
                  }}
                  className={`w-full glass-card rounded-xl p-4 flex items-center gap-3 text-left ${
                    !notif.read ? 'border-l-2 border-l-[#F04F51]' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{notif.message}</p>
                    <p className="text-xs text-[#AFAFAF] mt-0.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-[#F04F51] rounded-full shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Bell size={48} className="text-[#AFAFAF] mb-4" />
            <p className="text-[#AFAFAF]">No notifications yet</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
