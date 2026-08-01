'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Referral } from '@/lib/types'
import { formatNaira, formatDate } from '@/lib/utils'

export default function ReferralsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setUser(userData)

    const { data: referralData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', session.user.id)
      .order('created_at', { ascending: false })

    setReferrals(referralData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copyReferralLink = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referral_code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const totalEarned = referrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.reward_amount, 0)
  const completedReferrals = referrals.filter(r => r.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Referral Program</h1>
        <p className="text-purple-100">Invite friends and earn ₦500 for each referral</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Total Referrals</div>
          <div className="text-2xl font-bold text-gray-900">{referrals.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedReferrals}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Earned from Referrals</div>
          <div className="text-2xl font-bold text-emerald-600">{formatNaira(totalEarned)}</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl p-4 font-mono text-sm text-gray-700 overflow-hidden">
            {`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user?.referral_code}`}
          </div>
          <button
            onClick={copyReferralLink}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Share this link with friends. When they sign up, you&apos;ll earn ₦500 for each referral!
        </p>
      </div>

      {/* How it Works */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How Referrals Work</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">1</div>
            <div>
              <div className="font-medium text-gray-900">Share Your Link</div>
              <div className="text-sm text-gray-600">Send your unique referral link to friends</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">2</div>
            <div>
              <div className="font-medium text-gray-900">Friends Sign Up</div>
              <div className="text-sm text-gray-600">They create an account using your link</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">3</div>
            <div>
              <div className="font-medium text-gray-900">Earn ₦500</div>
              <div className="text-sm text-gray-600">Get ₦500 added to your balance instantly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referrals</h2>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No referrals yet</h3>
            <p className="text-gray-500">Share your referral link to start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">New Referral</div>
                    <div className="text-sm text-gray-500">{formatDate(referral.created_at)}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  referral.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {referral.status === 'completed' ? `+${formatNaira(referral.reward_amount)}` : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
