import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SnapfaceID - Personal Safety Dating App',
  description: 'Verify dates and stay safe with SnapfaceID - The #1 safety platform for women',
  icons: {
    icon: [
      { url: '/snapfaceid-favicons/favicon-purple-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/snapfaceid-favicons/favicon-purple-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/snapfaceid-favicons/favicon-purple-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/snapfaceid-favicons/favicon-purple-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/snapfaceid-favicons/favicon-purple-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/snapfaceid-favicons/favicon-purple-180x180.png',
    shortcut: '/snapfaceid-favicons/favicon-purple.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
