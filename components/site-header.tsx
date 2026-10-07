'use client'

import { BarChart3, Lock, Trash2, Upload } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { setDataset, useDataset } from '@/lib/sales/store'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/home', label: 'Home' },
  { href: '/ask', label: 'Ask Anything' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/loss', label: 'Loss Report' },
  { href: '/download', label: 'Download' },
]

export function SiteHeader() {
  const dataset = useDataset()
  const pathname = usePathname()
  const router = useRouter()
  const [notice, setNotice] = useState(false)
  const unlocked = Boolean(dataset?.confirmed)

  const clearData = () => {
    setDataset(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link href={unlocked ? '/home' : '/'} className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Sales Insight</span>
        </Link>

        <nav aria-label="Main" className="ml-2 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active = pathname === item.href
            if (!unlocked) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setNotice(true)}
                  aria-disabled="true"
                  className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/60"
                >
                  <Lock className="size-3" aria-hidden="true" />
                  {item.label}
                </button>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {dataset && (
            <>
              <Button variant="outline" onClick={clearData} className="hidden md:inline-flex">
                <Upload />
                New file
              </Button>
              <Button variant="destructive" onClick={clearData} aria-label="Delete my data">
                <Trash2 />
                <span className="hidden lg:inline">Delete my data</span>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
      {notice && !unlocked && (
        <div role="status" className="border-t bg-muted/60 px-4 py-2 text-center text-sm">
          Please upload your sales file first.{' '}
          <button type="button" className="font-medium underline" onClick={() => setNotice(false)}>
            OK
          </button>
        </div>
      )}
    </header>
  )
}
