export async function POST(req: Request) {
  try {
    const { text, language = "en-US" } = await req.json()

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ matches: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const url = "https://api.languagetool.org/v2/check"
    const params = new URLSearchParams()
    params.set("text", text)
    params.set("language", language)
    params.set("enabledOnly", "false")
    params.set("level", "picky")

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      // Note: LanguageTool free endpoint is CORS-friendly; we still proxy for consistent UX.
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(errText || "LanguageTool request failed", { status: res.status })
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return new Response(e?.message || "Unexpected error", { status: 500 })
  }
}
