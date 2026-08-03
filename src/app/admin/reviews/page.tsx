'use client'

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  full_name: string
  email: string
  tier: number
  balance: number
  tasks_completed_today: number
  referred_by: string | null
  created_at: string
}

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
  const [tab, setTab] = useState<'reviews' | 'users'>('reviews')

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
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
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
              Access Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <a href="/admin" className="text-sm text-emerald-600 hover:underline mb-1 inline-block">&larr; Back to Admin</a>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          <button
            onClick={() => setTab('reviews')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'reviews' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Payment Reviews
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'users' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Users
          </button>
        </div>

        {tab === 'reviews' ? <ReviewsTab password={password} /> : <UsersTab password={password} />}
      </div>
    </div>
  )
}

function ReviewsTab({ password }: { password: string }) {
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

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleApprove = async (request: ReviewRequest) => {
    if (!confirm(`Approve ${request.user?.email} for Tier ${request.to_tier}?`)) return
    setProcessing(request.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id: request.id, action: 'approve', user_id: request.user_id, to_tier: request.to_tier }),
      })
      if (res.ok) await fetchRequests()
      else {
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
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id: request.id, action: 'deny' }),
      })
      if (res.ok) await fetchRequests()
    } catch (err) {
      console.error('Error:', err)
    }
    setProcessing(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending reviews</h3>
        <p className="text-gray-500">All caught up!</p>
      </div>
    )
  }

  return (
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
  )
}

function UsersTab({ password }: { password: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Fetch users error:', err)
    }
    setLoading(false)
  }, [password, page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <p className="text-gray-600">{total} registered users</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search name or email..."
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Tier</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Tasks Today</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{user.full_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.tier === 3 ? 'bg-purple-100 text-purple-700' :
                          user.tier === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          Tier {user.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ₦{user.balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{user.tasks_completed_today}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
