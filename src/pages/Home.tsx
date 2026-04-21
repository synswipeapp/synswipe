import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/discover')
      } else {
        navigate('/')
      }
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F04F51] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
