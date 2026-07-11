import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MaintainIQ - AI-Powered Maintenance Platform',
  description: 'Scan. Report. Diagnose. Maintain. AI-powered QR maintenance and asset history platform.',
}

export const viewport: Viewport = {
  themeColor: '#1e2a4a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.className} antialiased font-sans`}>
        {children}
      </body>
    </html>
  )
}
