"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SuggestionItem } from "./suggestion-item"

type LTReplacement = { value: string }
type LTContext = { text: string; offset: number; length: number }
type LTRule = { id: string; description: string; issueType?: string; category?: { id: string; name: string } }
export type LTMatch = {
  message: string
  shortMessage?: string
  offset: number
  length: number
  sentence?: string
  replacements: LTReplacement[]
  context: LTContext
  rule: LTRule
}

type LTResponse = {
  matches: LTMatch[]
}

const defaultText = "This are example sentences with some mistake. It help demonstrate how the checker works."

export function GrammarChecker() {
  const [text, setText] = useState<string>(defaultText)
  const [language, setLanguage] = useState<string>("en-US")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LTResponse | null>(null)
  const lastCheckedTextRef = useRef<string | null>(null)

  const issueCount = results?.matches?.length ?? 0

  async function runCheck() {
    if (!text.trim()) {
      setResults({ matches: [] })
      lastCheckedTextRef.current = text
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || `Request failed with status ${res.status}`)
      }
      const data = (await res.json()) as LTResponse
      setResults(data)
      lastCheckedTextRef.current = text
    } catch (e: any) {
      setError(e?.message || "Something went wrong checking grammar.")
    } finally {
      setLoading(false)
    }
  }

  function requireFreshResults(): boolean {
    // Prevent applying offsets against a modified text body.
    if (lastCheckedTextRef.current !== text) {
      setError("Text changed since last check. Please run “Check grammar” again before applying suggestions.")
      return false
    }
    return true
  }

  function applySingle(match: LTMatch, replacement: string) {
    if (!requireFreshResults()) return
    const start = match.offset
    const end = start + match.length
    const next = text.slice(0, start) + replacement + text.slice(end)
    setText(next)
    // After any apply, results are stale. Clear and ask user to re-check.
    setResults(null)
    lastCheckedTextRef.current = null
  }

  function applyAll() {
    if (!requireFreshResults()) return
    if (!results?.matches?.length) return

    // Choose the first replacement for each applicable match.
    const applicable = results.matches
      .filter((m) => m.replacements?.length > 0)
      .map((m) => ({ ...m, chosen: m.replacements[0].value }))

    // Apply from right-to-left to avoid offset shifts.
    const sorted = applicable.sort((a, b) => b.offset - a.offset)

    let next = text
    for (const m of sorted) {
      const start = m.offset
      const end = start + m.length
      next = next.slice(0, start) + m.chosen + next.slice(end)
    }
    setText(next)
    setResults(null)
    lastCheckedTextRef.current = null
  }

  const issueBadges = useMemo(() => {
    const byType = new Map<string, number>()
    for (const m of results?.matches ?? []) {
      const t = m.rule?.issueType || m.rule?.category?.name || "Other"
      byType.set(t, (byType.get(t) ?? 0) + 1)
    }
    return Array.from(byType.entries())
  }, [results])

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Text</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <label className="text-sm text-muted-foreground" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              className="w-full md:w-auto rounded-md border bg-background px-3 py-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="de-DE">German</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="pt-BR">Portuguese (BR)</option>
              <option value="nl">Dutch</option>
              <option value="it">Italian</option>
            </select>
          </div>

          <textarea
            className="min-h-[180px] w-full resize-y rounded-md border bg-background p-3 leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            aria-label="Text to check"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{text.length} characters</span>
            <span>{text.split(/\s+/).filter(Boolean).length} words</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runCheck} disabled={loading}>
              {loading ? "Checking..." : "Check grammar"}
            </Button>
            <Button variant="secondary" onClick={applyAll} disabled={!results?.matches?.length}>
              Apply all suggestions
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText("")
                setResults(null)
                lastCheckedTextRef.current = null
                setError(null)
              }}
            >
              Clear
            </Button>
          </div>
          {error ? (
            <div className="text-sm text-red-600" role="alert">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Suggestions
            <Badge variant="secondary">{issueCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!results ? (
            <p className="text-sm text-muted-foreground">No analysis yet. Click “Check grammar” to see suggestions.</p>
          ) : results.matches.length === 0 ? (
            <p className="text-sm">No issues found. Nice work!</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1">
                {issueBadges.map(([label, count]) => (
                  <Badge key={label} variant="outline">
                    {label}: {count}
                  </Badge>
                ))}
              </div>
              <ul className="flex flex-col gap-3">
                {results.matches.map((m, idx) => (
                  <li key={`${m.offset}-${m.length}-${idx}`}>
                    <SuggestionItem
                      match={m}
                      onApply={(value) => applySingle(m, value)}
                      disabled={lastCheckedTextRef.current !== text}
                    />
                  </li>
                ))}
              </ul>
              <p className={cn("text-xs text-muted-foreground", lastCheckedTextRef.current !== text && "text-red-600")}>
                {lastCheckedTextRef.current !== text
                  ? "Text changed since last check. Please run “Check grammar” again before applying suggestions."
                  : "Tip: Apply suggestions one-by-one or all at once. Re-check after changes for new issues."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
