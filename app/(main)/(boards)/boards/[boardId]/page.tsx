"use client";

import { use } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

import dynamic from "next/dynamic";

interface BoardIdPageProps {
  params: Promise<{
    boardId: Id<"boards">;
  }>;
}

const Canvas = dynamic(() => import("@/components/canvas"), {
  ssr: false,
});

const BoardIdPage = ({ params }: BoardIdPageProps) => {
  const resolvedParams = use(params); // Unwrap the params Promise

  const board = useQuery(api.boards.getById, {
    boardId: resolvedParams.boardId, // Use the unwrapped params
  });

  const update = useMutation(api.boards.update);

  if (board === undefined) {
    return (
      <div>
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (board === null) {
    return <div className="p-12">Not found</div>;
  }

  return (
    <div className="pt-12 h-screen">
      <Canvas
        initialContent={board.content}
        onSaveContent={(content) =>
          update({ id: resolvedParams.boardId, content })
        }
      />
    </div>
  );
};

export default BoardIdPage;
