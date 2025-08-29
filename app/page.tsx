import type { Metadata } from "next"
import { GrammarChecker } from "@/components/grammar-checker"

export const metadata: Metadata = {
  title: "Grammar & Spelling Checker",
  description: "Check grammar, spelling, and style with suggestions powered by LanguageTool.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-pretty text-2xl md:text-3xl font-semibold">Grammar & Spelling Checker</h1>
        <p className="text-muted-foreground mt-2">
          Paste or type your text below. Click “Check grammar” to get suggestions and apply fixes.
        </p>
      </header>
      <GrammarChecker />
      <footer className="mt-10 text-xs text-muted-foreground">
        Powered by the free LanguageTool API. Suggestions may be limited by rate limits.
      </footer>
    </main>
  )
}
