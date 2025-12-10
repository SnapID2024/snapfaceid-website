import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SnapfaceID - Personal Safety Dating App',
  description: 'Verify dates and stay safe with SnapfaceID - The #1 safety platform for women',
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
