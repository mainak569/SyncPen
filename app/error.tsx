"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Error = () => {
  return (
    <div className="dark:bg-[#1F1F1F] min-h-screen flex flex-col items-center justify-center text-center px-6 space-y-6">
      <div className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] mx-auto">
        <Image
          src="/crashed-error.svg"
          height={350}
          width={350}
          alt="404 Not Found"
          className="dark:hidden w-full"
        />
        <Image
          src="/crashed-error_dark.svg"
          height={350}
          width={350}
          alt="404 Not Found"
          className="hidden dark:block w-full"
        />
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
        404 - Not Found
      </h1>

      <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-md mx-auto">
        The page you are looking for does not exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-6">
        <Button className="w-full sm:w-auto" asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button className="w-full sm:w-auto" asChild>
          <Link href="/documents">Sync a Note</Link>
        </Button>
        <Button className="w-full sm:w-auto" asChild>
          <Link href="/boards">Sync a Board</Link>
        </Button>
      </div>
    </div>
  );
};

export default Error;
