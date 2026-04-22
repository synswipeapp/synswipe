import { Link, useLocation } from 'react-router'
import { Compass, Trophy, User, HelpCircle } from 'lucide-react'

const tabs = [
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/support', label: 'Support', icon: HelpCircle },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="shrink-0 h-16 bg-[#1E1E1E] border-t border-white/[0.06] z-50 flex items-center justify-around px-2">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors duration-150"
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.5}
              className={isActive ? 'text-[#F04F51]' : 'text-[#AFAFAF]'}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? 'text-[#F04F51]' : 'text-[#AFAFAF]'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
