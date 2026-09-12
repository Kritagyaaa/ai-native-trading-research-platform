import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const preferredModel = process.env.GEMINI_MODEL || "gemini-flash-latest";

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  const { question } = await request.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "A valid question string is required." },
      { status: 400 }
    );
  }

  const systemPrompt = `You are a quantitative trading research assistant. Your task is to extract a formal, structured experiment specification from a natural-language trading hypothesis.

Scoping constraint: This prototype strictly supports the NIFTY 50 Index on daily closes.
Extract the following fields:
- instrument: The target asset mentioned (always return "NIFTY" for this prototype).
- timeframe: The bar or session resolution (default to "daily" if not specified).
- entry_condition: The explicit technical trigger with a concrete number (e.g. "Single-day decline >= 1.5%"). If the user only used an ambiguous phrase like "sharp fall" without an exact percentage, return null.
- exit_condition: The rule for exiting the trade (e.g. "Time-based exit after holding horizon", "Stop loss"). If not explicitly specified, return null.
- holding_period_days: The number of trading sessions/days to hold as an integer (e.g. 5). If not specified, return null.
- filters: Any market regime or volatility condition (e.g. "high_volatility" if high volatility or turmoil is mentioned, otherwise null).
- underlying_question: A concise, unambiguous one-sentence statement of what the user is trying to test.
- missing_fields: An array of strings listing key parameters that are null or underspecified and require clarification from the user. Only include names from: ["entry_condition", "holding_period_days", "exit_condition", "filters"].

Output MUST be a single raw JSON object matching this schema:
{
  "instrument": "NIFTY",
  "timeframe": "daily",
  "entry_condition": string | null,
  "exit_condition": string | null,
  "holding_period_days": number | null,
  "filters": string | null,
  "underlying_question": string,
  "missing_fields": string[]
}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          { text: `User hypothesis to analyze: "${question}"` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  // Verified active Google Gemini models
  const candidateModels = Array.from(
    new Set([preferredModel, "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.6-flash"])
  );

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed.missing_fields)) {
          parsed.missing_fields = [];
        }

        parsed.instrument = "NIFTY";
        parsed.timeframe = parsed.timeframe || "daily";

        return NextResponse.json(parsed);
      }

      const errText = await response.text();
      lastError = `Model ${model} returned ${response.status}: ${errText}`;
      if (response.status === 503 || response.status === 429 || response.status === 404) {
        continue;
      } else {
        break;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return NextResponse.json(
    { error: lastError || "Failed to parse experiment with Gemini API." },
    { status: 502 }
  );
}
