import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ely Admin',
  description: 'Hotel AI Management Dashboard',
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/knowledge', label: 'Knowledge Base', icon: '📚' },
  { href: '/leads', label: 'Leads', icon: '👥' },
  { href: '/analytics', label: 'AI Analytics', icon: '📈' },
  { href: '/guardrails', label: 'Guardrails', icon: '🛡️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-ely-900 text-white flex flex-col">
            <div className="p-6 border-b border-ely-800">
              <h1 className="text-xl font-bold">Ely Admin</h1>
              <p className="text-ely-300 text-sm mt-1">Hotel AI Management</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-ely-200 hover:bg-ely-800 hover:text-white transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-ely-800 text-ely-400 text-xs">
              Ely v1.0 &middot; AI Guest Agent
            </div>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
