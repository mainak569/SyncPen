"use client";

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  // React hook from Convex, a backend-as-a-service (BaaS) platform for building
  // real-time web applications with a focus on serverless databases and automatic reactivity
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl sd:text-5xl md:text-6xl font-bold">
        <span className="bg-gradient-to-r from-[#FFB100] to-[#321102] bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-[#2A7DFA] dark:to-white dark:bg-clip-text dark:text-transparent">
          Where Sync Meets Pen
        </span>
        <br />
        Welcome to <span className="underline">SyncPen</span>
      </h1>
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        Stay in sync. Stay productive.
        <br />
        Redefine Your Workday with SyncPen.
      </h3>
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}
      {isAuthenticated && !isLoading && (
        <div className="flex flex-col items-center justify-center sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <Button asChild className="max-w-[10rem]">
            <Link href="/documents">
              Sync a Note
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild className="max-w-[10rem]">
            <Link href="/boards">
              Sync a Board
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}

      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button>
            Enter SyncPen
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </SignInButton>
      )}
    </div>
  );
};

export default Heading;
