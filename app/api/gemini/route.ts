import { Message, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { initialMessage } from "@/lib/chatDataHome";
import { clientIpFrom, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Pinned to a model id this version of `@ai-sdk/google` actually lists, and
// kept overridable so the model can move without a code change. The id is only
// validated by Google at request time — the SDK's type falls back to a plain
// `string`, so a typo here fails as a 404 on every chat, not at build time.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-001";

// This endpoint is intentionally public (the landing-page chat is available
// before sign-up), so cap what a single request can forward...
const MAX_MESSAGES = 20;
const MAX_CONTENT_CHARS = 4000;

// ...and cap how often one caller can hit it, so an anonymous visitor cannot
// run up the Google bill. Keyed by IP since there is no user to key on.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export const runtime = "edge";

const generateId = () => Math.random().toString(36).slice(2, 15);

const buildGoogleGenAIPrompt = (messages: Message[]): Message[] => [
  {
    id: generateId(),
    role: "system",
    content: initialMessage.content,
  },
  ...messages.slice(-MAX_MESSAGES).map((message) => ({
    id: message.id || generateId(),
    role: message.role,
    content: String(message.content ?? "").slice(0, MAX_CONTENT_CHARS),
  })),
];

export async function POST(request: Request) {
  try {
    const limit = rateLimit(
      `marketing:${clientIpFrom(request)}`,
      RATE_LIMIT,
      RATE_WINDOW_MS
    );
    if (!limit.allowed) {
      return tooManyRequests(limit.retryAfter);
    }

    // Checked here rather than at module scope so a missing key fails the one
    // request instead of the whole build/boot.
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI is not configured on this server" }),
        { status: 503 }
      );
    }

    const body = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body format" }),
        { status: 400 }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const stream = streamText({
      model: google(MODEL),
      messages: buildGoogleGenAIPrompt(body.messages),
      temperature: 0.7,
    });

    return stream.toDataStreamResponse();
  } catch (error) {
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
