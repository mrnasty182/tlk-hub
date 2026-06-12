import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TLK Hub — The Loin Kings',
  description: 'The Loin Kings rehearsal and performance hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: 'system-ui, sans-serif',
        background: '#08060F',
        color: '#F0EBF8',
        margin: 0,
      }}>
        {children}
      </body>
    </html>
  )
}