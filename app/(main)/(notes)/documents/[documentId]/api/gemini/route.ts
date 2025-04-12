import { Message, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const uniqueId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 15);

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is not set in environment variables");
}

const google = createGoogleGenerativeAI({ apiKey });

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body format" }),
        { status: 400 }
      );
    }

    const prompt =
      body.prompt && body.prompt.trim() !== ""
        ? body.prompt
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

    const messages: Message[] = [initialMessage, ...body.messages];

    const stream = await streamText({
      model: google("gemini-1.5-flash"),
      messages,
      temperature: 0.7,
    });

    return stream?.toDataStreamResponse();
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
