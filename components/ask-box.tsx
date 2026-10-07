'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = { onAsk?: (question: string) => void; autoFocus?: boolean }

export function AskBox({ onAsk, autoFocus }: Props) {
  const router = useRouter()
  const [value, setValue] = useState('')

  const submit = () => {
    const q = value.trim()
    if (!q) return
    if (onAsk) {
      onAsk(q)
      setValue('')
    } else {
      router.push(`/ask?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Which region sells the most? / Sabse zyada profit kis category mein hai?"
          aria-label="Ask a question about your sales"
          className="h-10 pl-9"
          autoFocus={autoFocus}
        />
      </div>
      <Button type="submit" size="lg" className="h-10">
        Ask
      </Button>
    </form>
  )
}
