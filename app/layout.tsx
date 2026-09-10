import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ELIZZYVERSE',
  description: 'Build, preview, and publish websites with AI — powered by ELIZZYVERSE.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-[#0a0a12]">
      <body>{children}</body>
    </html>
  )
}
