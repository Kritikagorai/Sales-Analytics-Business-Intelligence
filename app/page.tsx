import { UploadBox } from '@/components/upload-box'

const STEPS = [
  { n: 1, title: 'Upload', text: 'Choose your sales CSV file.' },
  { n: 2, title: 'Check', text: 'Confirm the columns we found.' },
  { n: 3, title: 'See results', text: 'Get answers, charts and a loss report.' },
]

export default function UploadPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-12 md:py-20">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Understand your sales in simple words
        </h1>
        <p className="text-muted-foreground text-pretty">Upload your sales file to begin.</p>
      </div>

      <UploadBox />

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3 rounded-xl border bg-card p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {s.n}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{s.title}</span>
              <span className="text-sm text-muted-foreground">{s.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
