import './globals.css'
import Providers from './providers'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ekklyn', description: 'ADMVC' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
