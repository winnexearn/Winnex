import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://winnexearn.site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Winnex Earn - Earn Money from TikTok Videos in Nigeria",
    template: "%s | Winnex Earn",
  },
  description:
    "Earn up to ₦9,000/month by liking TikTok videos. Free to join, no registration fee. Thousands of Nigerians are already earning daily rewards. Start now!",
  keywords: [
    "earn money online",
    "tiktok",
    "nigeria",
    "make money online nigeria",
    "earn from tiktok",
    "daily income",
    "side hustle",
    "online earning platform",
    "watch videos earn money",
    "free earning site",
    "winnex earn",
  ],
  authors: [{ name: "Winnex Earn" }],
  creator: "Winnex Earn",
  publisher: "Winnex Earn",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Winnex Earn - Earn Money from TikTok Videos in Nigeria",
    description:
      "Earn up to ₦9,000/month by liking TikTok videos. Free to join, daily payouts. Start earning now!",
    url: SITE_URL,
    siteName: "Winnex Earn",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Winnex Earn - Earn Money from TikTok Videos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Winnex Earn - Earn Money from TikTok Videos in Nigeria",
    description:
      "Earn up to ₦9,000/month by liking TikTok videos. Free to join, daily payouts.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
