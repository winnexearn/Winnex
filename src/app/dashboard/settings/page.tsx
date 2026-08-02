'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, TIER_CONFIGS } from '@/lib/types'
import { formatNaira } from '@/lib/utils'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    if (res.ok) {
      setUser(await res.json())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade')
    const error = searchParams.get('error')
    if (upgradeStatus === 'success') {
      setSuccess(true)
      setProcessing(false)
      fetchData()
      setTimeout(() => setSuccess(false), 5000)
    }
    if (upgradeStatus === 'processing') {
      setProcessing(true)
      fetchData()
      const poll = setInterval(() => {
        fetchData()
      }, 3000)
      setTimeout(() => {
        clearInterval(poll)
        setProcessing(false)
      }, 30000)
    }
    if (error) {
      const messages: Record<string, string> = {
        no_ref: 'Invalid payment reference.',
        unknown_ref: 'Payment record not found.',
        payment_failed: 'Payment failed. Please try again.',
        payment_not_verified: 'Payment could not be verified. Please contact support.',
        upgrade_failed: 'Upgrade failed. Please try again.',
        tier_update_failed: 'Tier update failed. Please contact support.',
        network_error: 'Network error. Please try again.',
        payment_misconfigured: 'Payment system not configured.',
      }
      setErrorMsg(messages[error] || 'An error occurred.')
      setTimeout(() => setErrorMsg(''), 5000)
    }
  }, [searchParams, fetchData])

  const handleUpgradeTier = async (newTier: number) => {
    if (!user) return

    const tierConfig = TIER_CONFIGS[newTier]
    if (!confirm(`Are you sure you want to upgrade to Tier ${newTier} for ${formatNaira(tierConfig.upgradePrice)}?`)) {
      return
    }

    setSaving(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/tiers/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_tier: newTier }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error initiating payment. Please try again.')
        return
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setSuccess(true)
        await fetchData()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      alert('Error initiating payment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const dailyEarnings = (tier: 1 | 2 | 3) =>
    TIER_CONFIGS[tier].maxTasks * TIER_CONFIGS[tier].videoReward

  const monthlyEarnings = (tier: 1 | 2 | 3) => dailyEarnings(tier) * 30

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-300">Manage your account and upgrade your tier</p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Tier upgraded successfully! Your new tier is now active.
        </div>
      )}

      {processing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Payment received! Confirming with SquadCo... This may take a few seconds.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Current Tier */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Tier</h2>
        <div className={`p-6 rounded-xl text-white mb-4 ${
          user?.tier === 1 ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
          user?.tier === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
          'bg-gradient-to-br from-purple-500 to-indigo-600'
        }`}>
          <div className="text-sm opacity-80 mb-1">Tier {user?.tier}</div>
          <div className="text-2xl font-bold mb-4">
            {user?.tier === 1 ? 'Starter' : user?.tier === 2 ? 'Professional' : 'Legend'}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="opacity-80">Video Reward</div>
              <div className="font-semibold">{formatNaira(TIER_CONFIGS[user?.tier || 1].videoReward)}</div>
            </div>
            <div>
              <div className="opacity-80">Daily Tasks</div>
              <div className="font-semibold">{TIER_CONFIGS[user?.tier || 1].maxTasks}</div>
            </div>
            <div>
              <div className="opacity-80">Daily Income</div>
              <div className="font-semibold">{formatNaira(dailyEarnings(user?.tier as 1 | 2 | 3 || 1))}</div>
            </div>
            <div>
              <div className="opacity-80">Balance</div>
              <div className="font-semibold">{formatNaira(user?.balance || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Your Tier</h2>

        <div className="space-y-4">
          {/* Tier 2 */}
          {user?.tier && user.tier < 2 && (
            <div className="relative border-2 border-amber-400 rounded-xl p-4 bg-amber-50">
              <div className="absolute -top-3 left-4 bg-amber-500 text-white px-3 py-0.5 rounded-full text-xs font-semibold">
                MOST POPULAR
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div>
                  <div className="text-amber-600 font-semibold">Tier 2 - Professional</div>
                  <div className="text-sm text-gray-600 mt-1">
                    ₦200/video • 8 tasks/day
                  </div>
                  <div className="text-sm mt-2">
                    <span className="font-bold text-emerald-600">+₦{dailyEarnings(2).toLocaleString()}/day</span>
                    <span className="text-gray-500"> • </span>
                    <span className="font-bold text-gray-900">₦{monthlyEarnings(2).toLocaleString()}/month</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Pays for itself in 1 day. Upgrade once, earn forever.
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-2">{formatNaira(1000)}</div>
                </div>
                <button
                  onClick={() => handleUpgradeTier(2)}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Upgrade to Tier 2'}
                </button>
              </div>
            </div>
          )}

          {/* Tier 3 */}
          {user?.tier && user.tier < 3 && (
            <div className="relative border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
              <div className="absolute -top-3 left-4 bg-purple-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold">
                MAX EARNINGS
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div>
                  <div className="text-purple-600 font-semibold">Tier 3 - Legend</div>
                  <div className="text-sm text-gray-600 mt-1">
                    ₦300/video • 10 tasks/day
                  </div>
                  <div className="text-sm mt-2">
                    <span className="font-bold text-emerald-600">+₦{dailyEarnings(3).toLocaleString()}/day</span>
                    <span className="text-gray-500"> • </span>
                    <span className="font-bold text-gray-900">₦{monthlyEarnings(3).toLocaleString()}/month</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Double your income compared to Tier {user.tier === 1 ? '1' : '2'}.
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-2">{formatNaira(3000)}</div>
                </div>
                <button
                  onClick={() => handleUpgradeTier(3)}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Upgrade to Tier 3'}
                </button>
              </div>
            </div>
          )}

          {user?.tier === 3 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You&apos;re a Legend!</h3>
              <p className="text-gray-500">You&apos;ve reached the highest tier</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Full Name</span>
            <span className="font-medium text-gray-900">{user?.full_name}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Phone Number</span>
            <span className="font-medium text-gray-900">{user?.phone_number}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Bank</span>
            <span className="font-medium text-gray-900">{user?.bank_name}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-gray-600">Account Number</span>
            <span className="font-medium text-gray-900">{user?.account_number}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
