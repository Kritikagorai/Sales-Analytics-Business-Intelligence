import { CheckFile } from '@/components/check-file'

export const metadata = { title: 'Check your file - Sales Insight' }

export default function CheckPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <CheckFile />
    </main>
  )
}
