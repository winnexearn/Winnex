'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PoolItem {
  id: string
  content_type: 'tiktok_video' | 'ad'
  url: string
  title: string | null
  is_active: boolean
  created_at: string
}

export default function AdminContentPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [content, setContent] = useState<PoolItem[]>([])
  const [counts, setCounts] = useState({ videos: 0, ads: 0 })
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'tiktok_video' | 'ad'>('tiktok_video')
  const [title, setTitle] = useState('')
  const [urls, setUrls] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const fetchContent = useCallback(async () => {
    const res = await fetch('/api/admin/content', {
      headers: { 'x-admin-password': 'winnex_admin_2024' },
    })
    if (res.ok) {
      const data = await res.json()
      setContent(data.content)
      setCounts(data.counts)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchContent()
    }
  }, [authenticated, fetchContent])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'winnex_admin_2024') {
      setAuthenticated(true)
    } else {
      alert('Invalid password')
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const urlList = urls.split('\n').map((u) => u.trim()).filter((u) => u.length > 0)

    if (urlList.length === 0) {
      setMessage('Paste at least one URL')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'winnex_admin_2024',
        },
        body: JSON.stringify({
          content_type: type,
          urls: urlList,
          title: title || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(`Error: ${data.error || 'Something went wrong'}`)
        return
      }

      setMessage(`Added ${data.added} item(s)${data.duplicates ? `, skipped ${data.duplicates} duplicate(s)` : ''}`)
      setUrls('')
      setTitle('')
      await fetchContent()
    } catch (err) {
      console.error('Add content error:', err)
      setMessage('Error adding content')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: PoolItem) => {
    if (!confirm(`Delete this item?\n${item.url}`)) return

    try {
      const res = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'winnex_admin_2024',
        },
        body: JSON.stringify({ id: item.id }),
      })

      if (res.ok) {
        await fetchContent()
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Content Manager</h1>
            <p className="text-gray-600 mt-2">Enter admin password</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              Access
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
            <p className="text-gray-600">Add TikTok video and ad links to the pool</p>
          </div>
          <Link href="/admin" className="text-emerald-600 font-medium hover:text-emerald-700">← Back</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">TikTok Videos</div>
            <div className="text-3xl font-bold text-gray-900">{counts.videos}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Ads</div>
            <div className="text-3xl font-bold text-gray-900">{counts.ads}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Content to Pool</h2>

          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={type}
                onChange={(e) => setType(e.target.value as 'tiktok_video' | 'ad')}
              >
                <option value="tiktok_video">TikTok Video</option>
                <option value="ad">Ad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Trending dance video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLs (one per line)
              </label>
              <textarea
                rows={8}
                required
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                placeholder={'https://www.tiktok.com/@creator/video/1234567890\nhttps://www.tiktok.com/@creator/video/0987654321'}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste real TikTok video URLs or ad landing URLs. The app never reuses a link a user has already completed.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add to Pool'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Pool ({content.length})</h2>

          {content.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No content yet. Add some above.</div>
          ) : (
            <div className="space-y-3">
              {content.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                      item.content_type === 'tiktok_video'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.content_type === 'tiktok_video' ? 'Video' : 'Ad'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.title || 'Untitled'}</div>
                      <div className="text-xs text-gray-500 truncate">{item.url}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
