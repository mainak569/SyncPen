import { Message, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const uniqueId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 15);

// Pinned to a model id this version of `@ai-sdk/google` actually lists, and
// kept overridable so the model can move without a code change. The id is only
// validated by Google at request time — the SDK's type falls back to a plain
// `string`, so a typo here fails as a 404 on every chat, not at build time.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// Cap what we forward so a single request cannot run up an unbounded bill.
const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 8000;
const MAX_PROMPT_CHARS = 30000;

// Auth bounds abuse to real accounts, but one account can still hammer the
// Google key, so cap the rate per user too.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // This route is only reachable from a signed-in document page. Without this
    // check the Google API key is an open proxy for anyone who finds the URL.
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const limit = rateLimit(`notes:${userId}`, RATE_LIMIT, RATE_WINDOW_MS);
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

    const prompt =
      typeof body.prompt === "string" && body.prompt.trim() !== ""
        ? body.prompt.slice(0, MAX_PROMPT_CHARS)
        : "No page data available";

    const initialMessage: Message = {
      id: uniqueId(),
      role: "system",
      content: `You are an AI assistant for SyncPen Notes, a digital productivity and note-taking SaaS freemium application.
      ------------------------------------------------------------------------------------------
      Here is the user's page data,
      ${prompt}

      **data of the page referes to the data provided above** 
      above is the data of the user's page
      ------------------------------------------------------------------------------------------

      Use \`code\`, lists, and other markdown features as appropriate to answer the questions
      `,
    };

    // Only conversation turns come from the client. A "system" message in the
    // body would otherwise sit beside ours and could override the instructions.
    const history: Message[] = body.messages
      .filter(
        (message: Message) =>
          message.role === "user" || message.role === "assistant"
      )
      .slice(-MAX_MESSAGES)
      .map((message: Message) => ({
        id: message.id || uniqueId(),
        role: message.role,
        content: String(message.content ?? "").slice(0, MAX_CONTENT_CHARS),
      }));

    const google = createGoogleGenerativeAI({ apiKey });

    const stream = streamText({
      model: google(MODEL),
      messages: [initialMessage, ...history],
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
