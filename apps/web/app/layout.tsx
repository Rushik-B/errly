import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Errly - Track and Fix Errors Faster',
  description: 'The modern error tracking and debugging platform for developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.className}`}>
      <body 
        className="min-h-screen bg-gray-50 text-gray-900 antialiased"
        suppressHydrationWarning={true}
      >
        <main className="max-w-screen-xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
