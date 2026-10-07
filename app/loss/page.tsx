import { LossReport } from '@/components/loss-report'

export const metadata = { title: 'Loss Report - Sales Insight' }

export default function LossPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <LossReport />
    </main>
  )
}
