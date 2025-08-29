"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { LTMatch } from "./grammar-checker"
import { Badge } from "@/components/ui/badge"

export function SuggestionItem({
  match,
  onApply,
  disabled,
}: {
  match: LTMatch
  onApply: (replacement: string) => void
  disabled?: boolean
}) {
  const primary = match.replacements?.[0]?.value

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{match.shortMessage || match.message}</div>
              <div className="text-xs text-muted-foreground">
                Rule: {match.rule?.id} • {match.rule?.description}
              </div>
            </div>
            <Badge variant="outline">{match.rule?.issueType || match.rule?.category?.name || "Issue"}</Badge>
          </div>

          {match.sentence ? (
            <p className="text-sm">
              In: <span className="text-muted-foreground">{match.sentence}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {primary ? (
              <Button size="sm" onClick={() => onApply(primary)} disabled={disabled}>
                Apply “{primary}”
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled>
                No replacement available
              </Button>
            )}
            {match.replacements?.slice(1, 4).map((r, i) => (
              <Button key={i} size="sm" variant="secondary" onClick={() => onApply(r.value)} disabled={disabled}>
                {r.value}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
