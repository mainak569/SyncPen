import { Message, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { initialMessage } from "@/lib/chatDataHome";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  // console.error("GOOGLE_API_KEY is missing!");
  throw new Error("GOOGLE_API_KEY is not set in environment variables");
}

const google = createGoogleGenerativeAI({ apiKey });

export const runtime = "edge";

const generateId = () => Math.random().toString(36).slice(2, 15);

const buildGoogleGenAIPrompt = (messages: Message[]): Message[] => [
  {
    id: generateId(),
    role: "user",
    content: initialMessage.content,
  },
  ...messages.map((message) => ({
    id: message.id || generateId(),
    role: message.role,
    content: message.content,
  })),
];

export async function POST(request: Request) {
  try {
    // console.log("API Request Received");

    const body = await request.json();
    // console.log("Request Body:", body);

    if (!body.messages || !Array.isArray(body.messages)) {
      // console.error("Invalid request body format:", body);
      return new Response(
        JSON.stringify({ error: "Invalid request body format" }),
        { status: 400 }
      );
    }

    // console.log("Generating AI response...");

    const stream = await streamText({
      model: google("gemini-1.5-flash"),
      messages: buildGoogleGenAIPrompt(body.messages),
      temperature: 0.7,
    });

    // console.log("AI response generated successfully");
    return stream?.toDataStreamResponse();
  } catch (error) {
    // console.error("API Error:", error);

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
