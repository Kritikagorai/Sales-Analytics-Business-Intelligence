import { Dashboard } from '@/components/dashboard'
import { getAnalysis } from '@/lib/sales/analyses'

export const metadata = { title: 'Dashboard - Sales Insight' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const { a } = await searchParams
  const initial = a && getAnalysis(a) ? a : 'total-sales'
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Dashboard initialId={initial} />
    </main>
  )
}
