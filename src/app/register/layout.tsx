import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create your free Winnex Earn account and start earning money by watching TikTok videos. No registration fee required.',
  robots: { index: false, follow: true },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
