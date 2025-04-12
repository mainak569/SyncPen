"use client";

import { useState, useEffect, useRef } from "react";
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

import {
  X,
  Send,
  Loader2,
  MessagesSquare,
  MessageSquareText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";

export default function ChatBox() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
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
  } = useChat({ api: "/api/gemini" });

  const isLoading = status === "submitted" || status === "streaming";

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowChatIcon(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <AnimatePresence>
        {showChatIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
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
        )}
      </AnimatePresence>

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

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-4 rounded-lg break-words whitespace-pre-wrap max-w-full md:max-w-[75%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                        style={{ wordBreak: "break-word" }}
                      >
                        <ReactMarkdown
                          children={message.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              inline,
                              className,
                              children,
                              ...props
                            }: {
                              inline?: boolean;
                              className?: string;
                              children?: React.ReactNode;
                            }) {
                              return inline ? (
                                <code
                                  {...props}
                                  className="bg-gray-200 px-1 rounded"
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-gray-200 p-2 rounded">
                                  <code {...props}>{children}</code>
                                </pre>
                              );
                            },
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="w-full flex justify-center gap-3">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                      <button
                        className="underline"
                        type="button"
                        onClick={stop}
                      >
                        abort
                      </button>
                    </div>
                  )}

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

                  <div ref={scrollRef}></div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
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
}
