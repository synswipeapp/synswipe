import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl font-bold text-[#F04F51] mb-4" style={{ fontFamily: 'Outfit' }}>404</h1>
      <p className="text-lg text-white mb-2">Page not found</p>
      <p className="text-sm text-[#AFAFAF] mb-6 text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/discover')}
        className="h-12 bg-[#F04F51] text-white font-bold rounded-full px-8 flex items-center gap-2 active:scale-95 transition-transform"
      >
        <ArrowLeft size={18} />
        Go Home
      </button>
    </div>
  )
}
