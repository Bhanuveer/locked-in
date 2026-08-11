import type { User } from '../lib/api'
import { getTierTheme } from '../lib/theme'

export function RewardsBanner({ user }: { user: User }) {
  const theme = getTierTheme(user.reward_tier)
  const pointsToNext = theme.nextAt !== null ? theme.nextAt - user.points : null

  return (
    <div className={`rounded-xl p-5 text-white bg-gradient-to-r ${theme.gradient} ring-4 ${theme.ring}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{theme.emoji}</span>
          <div>
            <p className="font-semibold">{theme.label} tier</p>
            <p className="text-sm text-white/80">
              {pointsToNext !== null ? `${pointsToNext} points to next tier` : 'Top tier reached'}
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">{user.points}</p>
            <p className="text-xs text-white/80">points</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {user.streak_days} {user.streak_days === 1 ? 'day' : 'days'}
            </p>
            <p className="text-xs text-white/80">streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
