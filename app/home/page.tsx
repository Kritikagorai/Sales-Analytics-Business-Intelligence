import { HomeOverview } from '@/components/home-overview'

export const metadata = { title: 'Home - Sales Insight' }

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <HomeOverview />
    </main>
  )
}
