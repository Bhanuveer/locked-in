import type { User } from './api'

export interface TierTheme {
  label: string
  emoji: string
  gradient: string
  badge: string
  ring: string
  nextAt: number | null
}

const THEMES: Record<User['reward_tier'], TierTheme> = {
  none: {
    label: 'Getting started',
    emoji: '🌱',
    gradient: 'from-slate-500 to-slate-600',
    badge: 'bg-slate-100 text-slate-600',
    ring: 'ring-slate-200',
    nextAt: 30,
  },
  bronze: {
    label: 'Bronze',
    emoji: '🥉',
    gradient: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-100 text-amber-800',
    ring: 'ring-amber-300',
    nextAt: 150,
  },
  silver: {
    label: 'Silver',
    emoji: '🥈',
    gradient: 'from-sky-500 to-indigo-600',
    badge: 'bg-sky-100 text-sky-800',
    ring: 'ring-sky-300',
    nextAt: 500,
  },
  gold: {
    label: 'Gold',
    emoji: '🥇',
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    badge: 'bg-yellow-100 text-yellow-800',
    ring: 'ring-yellow-400',
    nextAt: null,
  },
}

export function getTierTheme(tier: User['reward_tier']): TierTheme {
  return THEMES[tier] ?? THEMES.none
}
