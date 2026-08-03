'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReviewRequest {
  id: string
  user_id: string
  from_tier: number
  to_tier: number
  amount_paid: number
  payment_status: string
  squad_ref: string
  created_at: string
  user?: { full_name: string; email: string }
}

export default function AdminReviewsPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }, [password])

  useEffect(() => {
    if (authenticated) {
      fetchRequests()
    }
  }, [authenticated, fetchRequests])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/reviews', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) {
      setAuthenticated(true)
    } else {
      alert('Invalid password')
    }
  }

  const handleApprove = async (request: ReviewRequest) => {
    if (!confirm(`Approve ${request.user?.email} for Tier ${request.to_tier}?`)) return

    setProcessing(request.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id: request.id, action: 'approve', user_id: request.user_id, to_tier: request.to_tier }),
      })

      if (res.ok) {
        await fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed')
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setProcessing(null)
  }

  const handleDeny = async (request: ReviewRequest) => {
    if (!confirm(`Deny ${request.user?.email}'s request?`)) return

    setProcessing(request.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id: request.id, action: 'deny' }),
      })

      if (res.ok) {
        await fetchRequests()
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setProcessing(null)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Review</h1>
            <p className="text-gray-600 mt-2">Admin access only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              Access Reviews
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Reviews</h1>
          <p className="text-gray-600">Verify user payments and upgrade their tiers</p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending reviews</h3>
            <p className="text-gray-500">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{req.user?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{req.user?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span>Wants: <span className="font-medium text-gray-900">Tier {req.to_tier}</span></span>
                      <span>Currently: <span className="font-medium">Tier {req.from_tier}</span></span>
                      <span>Amount: <span className="font-medium">₦{req.amount_paid.toLocaleString()}</span></span>
                      <span className="text-gray-400">{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={processing === req.id}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {processing === req.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleDeny(req)}
                      disabled={processing === req.id}
                      className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition disabled:opacity-50"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
