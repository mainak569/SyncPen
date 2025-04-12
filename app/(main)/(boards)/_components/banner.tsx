"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BannerProps {
  boardId: Id<"boards">;
}

export const Banner = ({ boardId }: BannerProps) => {
  const router = useRouter();
  const remove = useMutation(api.boards.remove);
  const restore = useMutation(api.boards.restore);

  const onRemove = () => {
    const promise = remove({ id: boardId });

    toast.promise(promise, {
      loading: "Deleting board...",
      success: "Board deleted!",
      error: "Failed to delete board.",
    });

    router.push("/boards");
  };
  const onRestore = () => {
    const promise = restore({ id: boardId });

    toast.promise(promise, {
      loading: "Restoring board...",
      success: "Board restored!",
      error: "Failed to restore board.",
    });
  };

  return (
    <div className="w-full bg-rose-500 text-center text-sm p-2 text-white flex items-center gap-x-2 justify-center">
      <p>This board is in the Trash.</p>
      <Button
        size="sm"
        onClick={onRestore}
        variant="outline"
        className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
      >
        Restore board
      </Button>
      <ConfirmModal onConfirm={onRemove}>
        <span>
          {/* span will remove hydration */}
          <Button
            size="sm"
            variant="outline"
            className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
          >
            Delete forever
          </Button>
        </span>
      </ConfirmModal>
    </div>
  );
};
