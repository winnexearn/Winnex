import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your Winnex Earn account. Access your dashboard and start earning from TikTok videos.',
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
