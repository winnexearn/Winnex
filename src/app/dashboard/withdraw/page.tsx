'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Withdrawal } from '@/lib/types'
import {
  formatNaira,
  formatDate,
  isWithdrawalDay,
  daysUntilNextWithdrawalDay,
  nextWithdrawalDayLabel,
} from '@/lib/utils'

export default function WithdrawPage() {
  const [user, setUser] = useState<User | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const fetchData = useCallback(async () => {
    const [meRes, withdrawalsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/withdrawals'),
    ])

    if (meRes.ok) {
      setUser(await meRes.json())
    }

    if (withdrawalsRes.ok) {
      setWithdrawals(await withdrawalsRes.json())
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !amount) return

    const withdrawAmount = parseFloat(amount)
    if (withdrawAmount < 1000) {
      alert('Minimum withdrawal is ₦1,000')
      return
    }
    if (withdrawAmount > user.balance) {
      alert('Insufficient balance')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error processing withdrawal. Please try again.')
        return
      }

      setSuccess(true)
      setAmount('')
      await fetchData()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Withdrawal error:', err)
      alert('Error processing withdrawal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const withdrawalOpen = isWithdrawalDay()
  const daysUntil = daysUntilNextWithdrawalDay()
  const nextDate = nextWithdrawalDayLabel()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Withdraw Earnings</h1>
        <p className="text-amber-100">Cash out your earnings to your bank account on the 1st of every month</p>
      </div>

      {!withdrawalOpen && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Withdrawals open on the 1st of every month</h3>
              <p className="text-gray-600 text-sm">
                Keep earning until then! Next withdrawal day is <span className="font-medium text-amber-700">{nextDate}</span> ({daysUntil} {daysUntil === 1 ? 'day' : 'days'} away).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Available Balance</div>
          <div className="text-4xl font-bold text-gray-900 mb-2">{formatNaira(user?.balance || 0)}</div>
          <div className="text-sm text-gray-500">Minimum withdrawal: ₦1,000 • Withdrawals open on the 1st of each month</div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Withdrawal</h2>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Withdrawal request submitted successfully!
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
            <input
              type="number"
              min="1000"
              max={user?.balance || 0}
              step="100"
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-2">Withdrawal to:</div>
            <div className="font-medium text-gray-900">{user?.bank_name}</div>
            <div className="text-gray-600">{user?.account_number}</div>
          </div>

          <button
            type="submit"
            disabled={submitting || !withdrawalOpen || !amount || parseFloat(amount) < 1000}
            className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawalOpen
              ? submitting ? 'Processing...' : 'Request Withdrawal'
              : 'Withdrawals Open on the 1st'}
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal History</h2>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No withdrawals yet</h3>
            <p className="text-gray-500">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    withdrawal.status === 'completed' ? 'bg-green-100' :
                    withdrawal.status === 'processing' ? 'bg-blue-100' :
                    withdrawal.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {withdrawal.status === 'completed' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : withdrawal.status === 'failed' ? (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{formatNaira(withdrawal.amount)}</div>
                    <div className="text-sm text-gray-500">{formatDate(withdrawal.created_at)}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' :
                  withdrawal.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  withdrawal.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
