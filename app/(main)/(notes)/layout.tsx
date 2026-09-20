"use client";

import { Spinner } from "@/components/spinner";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import Navigation from "@/components/collection/navigation";
import { notesCollection } from "@/components/collection/config";
import SearchCommand from "@/components/search-notes-command";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return redirect("/");
  }
  return (
    <div className="h-full flex dark:bg-[#1F1F1F]">
      <Navigation config={notesCollection} />
      <main className="flex-1 h-full overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
