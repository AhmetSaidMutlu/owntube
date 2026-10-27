'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { LogOut, Home, Video, Users, Settings, Moon, Sun } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/videos', icon: Video, label: 'Videos' },
  { href: '/subscriptions', icon: Users, label: 'Subs' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="flex h-12 items-center justify-between px-3 max-w-screen-2xl mx-auto w-full">

        {/* Left: logo (desktop only) */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base">
            <Logo className="h-6 w-6" />
            OwnTube
          </Link>
          <div className="flex items-center gap-0.5">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant={pathname === href ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-1.5 h-8 px-3 text-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile: compact icon nav in the top bar */}
        <div className="flex md:hidden items-center gap-0.5">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <button
                className={`
                  flex flex-col items-center justify-center px-3 py-1 rounded-md transition-colors
                  ${pathname === href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'}
                `}
                aria-label={label}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[9px] font-medium mt-0.5">{label}</span>
              </button>
            </Link>
          ))}
        </div>

        {/* Right: theme + logout */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="w-8 h-8"
          >
            <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 h-8 px-2.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}