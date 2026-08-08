'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { User, TIER_CONFIGS } from '@/lib/types'
import { formatNaira } from '@/lib/utils'

export default function TiersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    if (res.ok) setUser(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const tierConfig = user ? TIER_CONFIGS[user.tier] : TIER_CONFIGS[1]

  const dailyEarnings = (tier: 1 | 2 | 3) =>
    TIER_CONFIGS[tier].maxTasks * TIER_CONFIGS[tier].videoReward

  const monthlyEarnings = (tier: 1 | 2 | 3) => dailyEarnings(tier) * 30

  const nextTier = user?.tier === 1 ? 2 : user?.tier === 2 ? 3 : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your Tier</h1>

      {/* Current Tier Card */}
      <div className={`rounded-2xl p-6 text-white ${
        user?.tier === 1 ? 'bg-emerald-600' :
        user?.tier === 2 ? 'bg-amber-500' :
        'bg-purple-600'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Current Tier</p>
            <div className="text-3xl font-bold">
              Tier {user?.tier} — {user?.tier === 1 ? 'Starter' : user?.tier === 2 ? 'Professional' : 'Legend'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/70">Daily Income</div>
            <div className="text-xl font-bold">{formatNaira(dailyEarnings(user?.tier as 1 | 2 | 3 || 1))}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-white/70 text-xs">Tasks/Day</div>
            <div className="font-bold">{tierConfig.maxTasks}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-white/70 text-xs">Per Video</div>
            <div className="font-bold">{formatNaira(tierConfig.videoReward)}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-white/70 text-xs">Monthly</div>
            <div className="font-bold">{formatNaira(monthlyEarnings(user?.tier as 1 | 2 | 3 || 1))}</div>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {user?.tier && user.tier < 3 && nextTier && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Your Tier</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[2, 3].filter(t => t > user!.tier).map((t) => {
              const cfg = TIER_CONFIGS[t as 2 | 3]
              return (
                <div key={t} className="border border-gray-200 rounded-xl p-5 hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-gray-500">Tier {t}</div>
                      <div className="text-xl font-bold text-gray-900">
                        {t === 2 ? 'Professional' : 'Legend'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{formatNaira(cfg.upgradePrice)}</div>
                      <div className="text-xs text-gray-500">one-time</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasks/day</span>
                      <span className="font-medium">{cfg.maxTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Video reward</span>
                      <span className="font-medium">{formatNaira(cfg.videoReward)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily income</span>
                      <span className="font-bold text-emerald-600">{formatNaira(dailyEarnings(t as 2 | 3))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly income</span>
                      <span className="font-bold">{formatNaira(monthlyEarnings(t as 2 | 3))}</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/tiers/upgrade?to=${t}`}
                    className={`block w-full py-3 text-center rounded-xl font-semibold transition ${
                      t === 2
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Upgrade to Tier {t}
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center text-sm text-gray-600">
            <span className="font-semibold text-emerald-700">Smart move:</span> Upgrade pays for itself within{' '}
            {nextTier && Math.ceil(TIER_CONFIGS[nextTier].upgradePrice / (dailyEarnings(nextTier) - dailyEarnings(user.tier)))} day
            {nextTier && Math.ceil(TIER_CONFIGS[nextTier].upgradePrice / (dailyEarnings(nextTier) - dailyEarnings(user.tier))) === 1 ? '' : 's'}!
          </div>
        </div>
      )}

      {/* Already at max tier */}
      {user?.tier === 3 && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="text-lg font-semibold text-purple-900">You&apos;re on the highest tier!</div>
          <p className="text-purple-600 text-sm mt-1">Enjoy maximum earnings with Legend tier</p>
        </div>
      )}

      {/* All Tiers Comparison */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compare All Tiers</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((t) => {
            const cfg = TIER_CONFIGS[t as 1 | 2 | 3]
            const isCurrent = user?.tier === t
            return (
              <div key={t} className={`rounded-xl p-5 border-2 ${isCurrent ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100'}`}>
                {isCurrent && <div className="text-xs font-semibold text-emerald-600 mb-2">YOUR TIER</div>}
                <div className="text-sm text-gray-500">Tier {t}</div>
                <div className="text-xl font-bold text-gray-900 mb-3">
                  {t === 1 ? 'Starter' : t === 2 ? 'Professional' : 'Legend'}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Tasks/day</span><span className="font-medium">{cfg.maxTasks}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Per video</span><span className="font-medium">{formatNaira(cfg.videoReward)}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-600">Daily income</span><span className="font-bold text-emerald-600">{formatNaira(dailyEarnings(t as 1 | 2 | 3))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Monthly income</span><span className="font-bold">{formatNaira(monthlyEarnings(t as 1 | 2 | 3))}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Verify Payment */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
        <p className="text-amber-800 font-medium mb-2">Already paid but tier not updated?</p>
        <Link href="/dashboard/settings" className="text-amber-600 font-semibold hover:underline">
          Verify Payment →
        </Link>
      </div>
    </div>
  )
}
