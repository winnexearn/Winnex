'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    accountNumber: '',
    bankName: 'Nigerian Bank',
    password: '',
    confirmPassword: '',
    referralCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.phoneNumber.length < 11) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    if (formData.accountNumber.length < 10) {
      setError('Please enter a valid account number')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            account_number: formData.accountNumber,
            bank_name: formData.bankName,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            account_number: formData.accountNumber,
            bank_name: formData.bankName,
            tier: 1,
            balance: 0,
            commission_balance: 0,
            total_earned: 0,
            referral_code: referralCode,
            referred_by: formData.referralCode || null,
            tasks_completed_today: 0,
          })

        if (profileError) throw profileError

        if (formData.referralCode) {
          const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', formData.referralCode)
            .single()

          if (referrer) {
            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referred_id: authData.user.id,
              reward_amount: 500,
            })
          }
        }

        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Winnex <span className="text-emerald-600">Earn</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Start earning money today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="08012345678"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Enter your 10-digit account number"
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              >
                <option value="Access Bank">Access Bank</option>
                <option value="Citibank Nigeria">Citibank Nigeria</option>
                <option value="Ecobank Nigeria">Ecobank Nigeria</option>
                <option value="Fidelity Bank">Fidelity Bank</option>
                <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                <option value="First City Monument Bank">First City Monument Bank</option>
                <option value="Globus Bank">Globus Bank</option>
                <option value="Guaranty Trust Bank">Guaranty Trust Bank</option>
                <option value="Heritage Bank">Heritage Bank</option>
                <option value="Keystone Bank">Keystone Bank</option>
                <option value="Opay">Opay</option>
                <option value="Paga">Paga</option>
                <option value="Polaris Bank">Polaris Bank</option>
                <option value="Providus Bank">Providus Bank</option>
                <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                <option value="Sterling Bank">Sterling Bank</option>
                <option value="SunTrust Bank">SunTrust Bank</option>
                <option value="Titan Trust Bank">Titan Trust Bank</option>
                <option value="Union Bank of Nigeria">Union Bank of Nigeria</option>
                <option value="United Bank for Africa">United Bank for Africa</option>
                <option value="Unity Bank">Unity Bank</option>
                <option value="VFD Microfinance Bank">VFD Microfinance Bank</option>
                <option value="Wema Bank">Wema Bank</option>
                <option value="Zenith Bank">Zenith Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (Optional)</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Enter referral code"
                value={formData.referralCode}
                onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
