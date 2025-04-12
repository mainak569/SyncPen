"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BoardsPage = () => {
  const { user } = useUser();
  const router = useRouter();

  const create = useMutation(api.boards.create); // useMutation = hook = handling API mutations
  // useMutation = handle async operations
  // api.boards.create = to create a new board

  const onCreate = () => {
    const promise = create({ title: "Untitled" }).then((boardId) =>
      router.push(`/boards/${boardId}`)
    );

    toast.promise(promise, {
      loading: "Creating a new board...",
      success: "New board created!",
      error: "Failed to create a new board.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
      <Image
        src="/empty.svg"
        height={350}
        width={350}
        alt="Empty"
        className="dark:hidden w-full max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] mx-auto"
      />
      <Image
        src="/empty_dark.svg"
        height={350}
        width={350}
        alt="Empty"
        className="hidden dark:block w-full max-w-[90%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] mx-auto"
      />

      <h2 className="text-lg sm:text-xl md:text-2xl font-medium">
        Welcome to {user?.firstName}&apos;s SyncPen
      </h2>

      <Button onClick={onCreate} className="sm:w-auto mb-6">
        <PlusCircle className="h-4 w-4 mr-2" />
        Create a board
      </Button>
    </div>
  );
};

export default BoardsPage;
