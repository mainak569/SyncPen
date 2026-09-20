"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEdgeStore } from "@/lib/edgestore";
import { deleteUploadedFiles } from "@/lib/edgestore-cleanup";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CollectionConfig,
  CollectionTable,
  fileUrlsFromRemove,
} from "./config";

interface BannerProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
  itemId: Id<T>;
}

/** The red "this is in the Trash" bar shown above an archived item. */
export const Banner = <T extends CollectionTable>({
  config,
  itemId,
}: BannerProps<T>) => {
  const router = useRouter();
  const { edgestore } = useEdgeStore();
  const remove = useMutation(config.api.remove);
  const restore = useMutation(config.api.restore);

  const onRemove = () => {
    // Cleans up the EdgeStore files for every row the cascade deleted, for the
    // collections that have any. Chained rather than awaited so navigation
    // still happens immediately: this banner renders on the item's own page,
    // and staying put would leave `getById` querying a row that no longer
    // exists.
    const promise = remove({ id: itemId }).then(async (result) => {
      if (config.cleansUpUploads) {
        await deleteUploadedFiles(
          edgestore.publicFiles,
          fileUrlsFromRemove(result)
        );
      }
    });

    toast.promise(promise, {
      loading: `Deleting ${config.noun}...`,
      success: `${config.Noun} deleted!`,
      error: `Failed to delete ${config.noun}.`,
    });

    router.push(config.basePath);
  };

  const onRestore = () => {
    const promise = restore({ id: itemId });

    toast.promise(promise, {
      loading: `Restoring ${config.noun}...`,
      success: `${config.Noun} restored!`,
      error: `Failed to restore ${config.noun}.`,
    });
  };

  return (
    <div className="w-full bg-rose-500 text-center text-sm p-2 text-white flex items-center gap-x-2 justify-center">
      <p>This {config.noun} is in the Trash.</p>
      <Button
        size="sm"
        onClick={onRestore}
        variant="outline"
        className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
      >
        Restore {config.noun}
      </Button>
      <ConfirmModal onConfirm={onRemove}>
        <span>
          {/* span to remove hydration of buttons inside buttons */}
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
