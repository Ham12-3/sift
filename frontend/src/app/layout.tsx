import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sift — AI Code Review',
  description: 'AI code review with full repository context. Find the flaw humans miss.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen w-full overflow-x-hidden">
          <div className="sift-aurora" />
          <div className="relative z-[1]">
            <AuthProvider>{children}</AuthProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
