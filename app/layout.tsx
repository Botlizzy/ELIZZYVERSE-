import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Forge Studio', description: 'Build, preview, and publish websites with AI.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-[#0b0d0f]"><body>{children}</body></html>
}
