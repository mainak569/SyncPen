"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Search, Trash, Undo2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const TrashBox = () => {
  const router = useRouter();
  const params = useParams();
  const boards = useQuery(api.boards.getTrash);
  const restore = useMutation(api.boards.restore);
  const remove = useMutation(api.boards.remove);

  const [search, setSearch] = useState("");
  const filteredBoards = boards?.filter((board) => {
    return board.title.toLowerCase().includes(search.toLowerCase());
  });

  const onClick = (boardId: string) => {
    router.push(`/boards/${boardId}`);
  };

  const onRestore = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    boardId: Id<"boards">
  ) => {
    event.stopPropagation();
    const promise = restore({ id: boardId });

    toast.promise(promise, {
      loading: "Restoring board...",
      success: "Board restored!",
      error: "Failed to restore board.",
    });
  };

  const onRemove = async (boardId: Id<"boards">) => {
    // try-catch = to avoid race condition
    try {
      const result = await toast.promise(remove({ id: boardId }), {
        loading: "Deleting board...",
        success: "Board deleted!",
        error: "Failed to delete board.",
      });

      if (params.boardId === boardId) {
        router.push("/boards");
      }

      return result; // Optionally return the result of the deletion
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  };

  if (boards === undefined) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
          placeholder="Filter by board title..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
          No boards found.
        </p>
        {filteredBoards?.map((board) => (
          <div
            key={board._id}
            role="button"
            onClick={() => onClick(board._id)}
            className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
          >
            <span>{board.title}</span>
            <div className="flex items-center">
              <div
                onClick={(e) => onRestore(e, board._id)}
                role="button"
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                <Undo2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <ConfirmModal onConfirm={() => onRemove(board._id)}>
                <div
                  role="button"
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  <Trash className="h-4 w-4 text-muted-foreground" />
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrashBox;
