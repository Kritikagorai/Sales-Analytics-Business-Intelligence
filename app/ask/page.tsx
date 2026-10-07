import { AskAnything } from '@/components/ask-anything'

export const metadata = { title: 'Ask Anything - Sales Insight' }

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <AskAnything initialQuestion={q ?? null} />
    </main>
  )
}
