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
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [savingBank, setSavingBank] = useState(false)
  const [bankSuccess, setBankSuccess] = useState(false)
  const [selectedTier, setSelectedTier] = useState<number>(0)
  const [verifying, setVerifying] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    if (res.ok) {
      const me = await res.json()
      setUser(me)
      setBankName(me.bank_name || '')
      setAccountNumber(me.account_number || '')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade')
    const error = searchParams.get('error')
    if (upgradeStatus === 'success') {
      setSuccess(true)
      setProcessing(false)
      fetchData()
      setTimeout(() => setSuccess(false), 5000)
    }
    if (upgradeStatus === 'expired') {
      setErrorMsg('Payment expired. Please try again.')
      setTimeout(() => setErrorMsg(''), 5000)
    }
    if (upgradeStatus === 'processing') {
      setProcessing(true)
      fetchData()
      const poll = setInterval(() => fetchData(), 3000)
      setTimeout(() => { clearInterval(poll); setProcessing(false) }, 30000)
    }
    if (error) {
      const messages: Record<string, string> = {
        no_ref: 'Invalid payment reference.',
        unknown_ref: 'Payment record not found.',
        payment_failed: 'Payment failed. Please try again.',
        payment_not_verified: 'Payment could not be verified. Contact support at winnexearn@gmail.com.',
        upgrade_failed: 'Upgrade failed. Please try again.',
        tier_update_failed: 'Tier update failed. Contact support at winnexearn@gmail.com.',
        network_error: 'Network error. Please try again.',
        payment_misconfigured: 'Payment system not configured.',
      }
      setErrorMsg(messages[error] || 'An error occurred.')
      setTimeout(() => setErrorMsg(''), 5000)
    }
  }, [searchParams, fetchData])

  const handleSaveBank = async () => {
    if (!bankName || !accountNumber) {
      setErrorMsg('Bank name and account number are required.')
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      setErrorMsg('Account number must be exactly 10 digits.')
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }
    setSavingBank(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/user/bank-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_name: bankName, account_number: accountNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update bank details.')
        setTimeout(() => setErrorMsg(''), 4000)
        return
      }
      setBankSuccess(true)
      await fetchData()
      setTimeout(() => setBankSuccess(false), 3000)
    } catch {
      setErrorMsg('Error saving bank details. Please try again.')
      setTimeout(() => setErrorMsg(''), 4000)
    } finally {
      setSavingBank(false)
    }
  }

  const handleManualVerify = async () => {
    if (!selectedTier) {
      setErrorMsg('Please select the tier you paid for.')
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }
    setVerifying(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/tiers/request-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_tier: selectedTier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Verification request failed.')
        setTimeout(() => setErrorMsg(''), 5000)
        return
      }
      setSuccess(true)
      setSelectedTier(0)
      await fetchData()
      setTimeout(() => setSuccess(false), 5000)
    } catch {
      setErrorMsg('Error submitting request. Please try again.')
      setTimeout(() => setErrorMsg(''), 4000)
    } finally {
      setVerifying(false)
    }
  }

  const handleUpgradeTier = async (newTier: number) => {
    if (!user) return
    const tierConfig = TIER_CONFIGS[newTier]
    if (!confirm(`Upgrade to Tier ${newTier} for ${formatNaira(tierConfig.upgradePrice)}?`)) return
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
    } catch {
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

  const dailyEarnings = (tier: 1 | 2 | 3) => TIER_CONFIGS[tier].maxTasks * TIER_CONFIGS[tier].videoReward
  const monthlyEarnings = (tier: 1 | 2 | 3) => dailyEarnings(tier) * 30

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-gray-400">Manage your account</p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Success! Your changes have been saved.
        </div>
      )}

      {processing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Payment received! Confirming with SquadCo...
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 1. Current Tier */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Tier</h2>
        <div className={`p-6 rounded-xl text-white ${
          user?.tier === 1 ? 'bg-emerald-600' :
          user?.tier === 2 ? 'bg-amber-500' :
          'bg-purple-600'
        }`}>
          <div className="text-sm text-white/70 mb-1">Tier {user?.tier}</div>
          <div className="text-2xl font-bold mb-4">
            {user?.tier === 1 ? 'Starter' : user?.tier === 2 ? 'Professional' : 'Legend'}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-white/70">Video Reward</div>
              <div className="font-semibold">{formatNaira(TIER_CONFIGS[user?.tier || 1].videoReward)}</div>
            </div>
            <div>
              <div className="text-white/70">Daily Tasks</div>
              <div className="font-semibold">{TIER_CONFIGS[user?.tier || 1].maxTasks}</div>
            </div>
            <div>
              <div className="text-white/70">Daily Income</div>
              <div className="font-semibold">{formatNaira(dailyEarnings(user?.tier as 1 | 2 | 3 || 1))}</div>
            </div>
            <div>
              <div className="text-white/70">Monthly Income</div>
              <div className="font-semibold">{formatNaira(monthlyEarnings(user?.tier as 1 | 2 | 3 || 1))}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Upgrade Tier */}
      {user?.tier && user.tier < 3 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Tier</h2>
          <div className="space-y-4">
            {user.tier < 2 && (
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-amber-700 font-semibold">Tier 2 — Professional</div>
                    <div className="text-sm text-gray-600 mt-1">₦150/video • 7 tasks/day</div>
                    <div className="text-sm mt-1">
                      <span className="font-bold text-emerald-600">₦{dailyEarnings(2).toLocaleString()}/day</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="font-bold text-gray-900">₦{monthlyEarnings(2).toLocaleString()}/month</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-2">{formatNaira(1000)}</div>
                  </div>
                  <button
                    onClick={() => handleUpgradeTier(2)}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50"
                  >
                    {saving ? 'Processing...' : 'Upgrade'}
                  </button>
                </div>
              </div>
            )}

            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-purple-700 font-semibold">Tier 3 — Legend</div>
                  <div className="text-sm text-gray-600 mt-1">₦300/video • 10 tasks/day</div>
                  <div className="text-sm mt-1">
                    <span className="font-bold text-emerald-600">₦{dailyEarnings(3).toLocaleString()}/day</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span className="font-bold text-gray-900">₦{monthlyEarnings(3).toLocaleString()}/month</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-2">{formatNaira(3000)}</div>
                </div>
                <button
                  onClick={() => handleUpgradeTier(3)}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Verify Payment */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Verify Payment</h2>
        <p className="text-sm text-gray-500 mb-4">
          Already paid but your tier wasn&apos;t upgraded? Select the tier you paid for and submit for review.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(Number(e.target.value))}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={0}>Select tier you paid for...</option>
            {user?.tier === 1 && <option value={2}>Tier 2 — ₦1,000</option>}
            {user?.tier !== 3 && <option value={3}>Tier 3 — ₦3,000</option>}
          </select>
          <button
            onClick={handleManualVerify}
            disabled={verifying || !selectedTier}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {verifying ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>

      {/* 4. Account Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Full Name</span>
            <span className="font-medium text-gray-900">{user?.full_name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium text-gray-900">{user?.phone_number}</span>
          </div>
        </div>
      </div>

      {/* 5. Bank Details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Bank Details</h2>
        <p className="text-sm text-gray-500 mb-4">For withdrawals. Processed on the 1st of every month.</p>

        {bankSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            Bank details updated!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select your bank</option>
              {[
                'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
                'First Bank of Nigeria', 'First City Monument Bank', 'Globus Bank',
                'Guaranty Trust Bank', 'Heritage Bank', 'Keystone Bank', 'Kuda Bank',
                'Opay', 'Palmpay', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
                'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank', 'Titan Trust Bank',
                'Union Bank of Nigeria', 'United Bank for Africa', 'Unity Bank', 'VBank',
                'Wema Bank', 'Zenith Bank',
              ].map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 1234567890"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleSaveBank}
            disabled={savingBank}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {savingBank ? 'Saving...' : 'Save Bank Details'}
          </button>
        </div>
      </div>
    </div>
  )
}
