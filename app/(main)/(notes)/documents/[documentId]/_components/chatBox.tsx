import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ComponentProps } from "react";

import {
  X,
  Send,
  Loader2,
  MessagesSquare,
  MessageSquareText,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";

const ChatBox = ({ pageData }: { pageData: string }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatIconRef = useRef<HTMLButtonElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    reload,
    error,
  } = useChat({
    api: "/documents/[documentsId]/api/gemini",
    body: { prompt: pageData },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const scrollRef = useRef<HTMLDivElement>(null);

  // Track copied message index
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null
  );

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index); // Set the copied message index
      setTimeout(() => setCopiedMessageIndex(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* Chat icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-6 right-6 z-500"
      >
        <Button
          ref={chatIconRef}
          onClick={() => setIsChatOpen(!isChatOpen)}
          size="icon"
          className={cn(
            "rounded-full size-16 p-3 shadow-xl text-white transition-all",
            "opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          )}
        >
          {isChatOpen ? (
            <MessagesSquare className="size-10 animate-pulse" />
          ) : (
            <MessageSquareText className="size-10" />
          )}
        </Button>
      </motion.div>

      {/* Chat box */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-500 w-[95%] md:w-[500px]"
          >
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">
                  Chat with SyncPen AI
                </CardTitle>
                <Button
                  onClick={() => setIsChatOpen(false)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4 overflow-auto">
                  {!messages.length && (
                    <div className="w-full mt-32 text-gray-500 flex justify-center">
                      No message yet.
                    </div>
                  )}

                  {/* Render chat messages */}
                  {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    return (
                      <div
                        key={index}
                        className={`mb-4 relative ${isUser ? "text-right" : "text-left"}`}
                      >
                        <div
                          className={`inline-block p-4 rounded-lg break-words whitespace-pre-wrap max-w-full md:max-w-[75%] ${
                            isUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                          style={{ wordBreak: "break-word" }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({
                                inline,
                                className,
                                children,
                                ...props
                              }: ComponentProps<"code"> & {
                                inline?: boolean;
                              }) {
                                return inline ? (
                                  <code
                                    className="bg-gray-200 px-1 rounded text-sm"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                                    <code
                                      className={`text-sm ${className || ""}`}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  </pre>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          {!isUser && (
                            <div className="mt-2 flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-6 hover:bg-accent"
                                onClick={() =>
                                  handleCopy(message.content, index)
                                }
                              >
                                {copiedMessageIndex === index ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1 text-green-500" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading state */}
                  {isLoading && (
                    <div className="w-full flex items-center justify-center gap-4 p-3">
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                      <button
                        className="text-primary font-medium hover:text-red-500 transition duration-200"
                        type="button"
                        onClick={stop}
                      >
                        Abort
                      </button>
                    </div>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="w-full flex justify-center gap-3">
                      <div>An error occurred.</div>
                      <button
                        className="underline"
                        type="button"
                        onClick={() => reload()}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Scroll reference */}
                  <div ref={scrollRef}></div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                {/* Input form */}
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full items-center space-x-2"
                >
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1"
                    placeholder="Type your message..."
                  />
                  <Button
                    type="submit"
                    className="size-9"
                    disabled={isLoading}
                    size="icon"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBox;
