import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Snowflake, X, CheckCircle, AlertTriangle } from 'lucide-react'

type ToastType = 'fire' | 'ice' | 'success' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timers.current.delete(id)
    }, 4000)

    timers.current.set(id, timer)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const iconMap: Record<ToastType, React.ReactNode> = {
    fire: <Flame size={18} className="text-orange-400" />,
    ice: <Snowflake size={18} className="text-cyan-400" />,
    success: <CheckCircle size={18} className="text-[#4ADE80]" />,
    warning: <AlertTriangle size={18} className="text-yellow-400" />,
    info: <span className="text-[#60A5FA] text-lg">ℹ</span>,
  }

  const bgMap: Record<ToastType, string> = {
    fire: 'bg-orange-500/10 border-orange-500/20',
    ice: 'bg-cyan-500/10 border-cyan-500/20',
    success: 'bg-[#4ADE80]/10 border-[#4ADE80]/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-[#60A5FA]/10 border-[#60A5FA]/20',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`pointer-events-auto mx-auto max-w-sm w-full ${bgMap[toast.type]} border rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl`}
            >
              {iconMap[toast.type]}
              <p className="flex-1 text-sm text-white">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X size={14} className="text-white/60" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
