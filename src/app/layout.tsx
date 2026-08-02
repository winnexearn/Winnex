import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Winnex Earn - Earn Money from TikTok & Ads",
  description: "Earn money by watching ads and liking TikTok videos. Join thousands of Nigerians earning daily rewards.",
  keywords: ["earn money", "tiktok", "ads", "nigeria", "rewards", "cash"],
  openGraph: {
    title: "Winnex Earn - Earn Money from TikTok & Ads",
    description: "Earn money by watching ads and liking TikTok videos.",
    url: "https://winnexearn.com",
    siteName: "Winnex Earn",
    locale: "en_NG",
    type: "website",
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
