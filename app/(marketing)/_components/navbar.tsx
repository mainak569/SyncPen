"use client";

import { useScrollTop } from "@/hooks/use-scroll-top";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useConvexAuth } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const scrolled = useScrollTop(); // to fix the nav_bar
  return (
    <div
      className={cn(
        "z-50 bg-background dark:bg-[#1F1F1F] fixed top-0 flex items-center w-full p-6",
        scrolled && "border-b shadow-sm"
      )}
    >
      <Logo />
      <div className="md:ml-auto md:justify-end justify-between w-full flex items-center gap-x-2">
        {isLoading && <Spinner />}
        {!isAuthenticated && !isLoading && (
          <>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                // className="bg-gray-200 text-black hover:bg-gray-300 dark:bg-[#36454F] dark:text-white dark:hover:bg-gray-800 px-4 py-2 transition-all shadow-md"
                className="bg-gray-200 text-black hover:bg-gray-300
                dark:bg-black dark:text-white dark:hover:bg-[#0e0e0e]
                 px-4 py-2 transition-all shadow-sm"
              >
                Log In
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button size="sm">Get SyncPen free</Button>
            </SignInButton>
          </>
        )}
        {isAuthenticated && !isLoading && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Enter SyncPen
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/boards">Board</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/documents">Notes</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton afterSignOutUrl="/" />
          </div>
        )}
        <ModeToggle />
      </div>
    </div>
  );
};

export default Navbar;
