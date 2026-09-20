"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEdgeStore } from "@/lib/edgestore";
import { deleteUploadedFiles } from "@/lib/edgestore-cleanup";
import { Search, Trash, Undo2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  CollectionConfig,
  CollectionTable,
  fileUrlsFromRemove,
} from "./config";

interface TrashBoxProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
}

const TrashBox = <T extends CollectionTable>({
  config,
}: TrashBoxProps<T>) => {
  const router = useRouter();
  const params = useParams();
  const { edgestore } = useEdgeStore();
  const items = useQuery(config.api.getTrash, {});
  const restore = useMutation(config.api.restore);
  const remove = useMutation(config.api.remove);

  const [search, setSearch] = useState("");
  const filteredItems = items?.filter((item) => {
    return item.title.toLowerCase().includes(search.toLowerCase());
  });

  const onClick = (itemId: string) => {
    router.push(`${config.basePath}/${itemId}`);
  };

  const onRestore = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    itemId: Id<T>
  ) => {
    event.stopPropagation();
    const promise = restore({ id: itemId });

    toast.promise(promise, {
      loading: `Restoring ${config.noun}...`,
      success: `${config.Noun} restored!`,
      error: `Failed to restore ${config.noun}.`,
    });
  };

  const onRemove = async (itemId: Id<T>) => {
    // The mutation deletes the item and its whole subtree, then reports the
    // uploads those rows owned so their EdgeStore files go too.
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

    // try-catch = to avoid race condition
    try {
      await promise;

      if (params[config.routeParam] === itemId) {
        router.push(config.basePath);
      }
    } catch (error) {
      console.error(`Failed to delete ${config.noun}:`, error);
    }
  };

  if (items === undefined) {
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
          placeholder={`Filter by ${config.noun} title...`}
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
          No {config.noun}s found.
        </p>
        {filteredItems?.map((item) => (
          <div
            key={item._id}
            role="button"
            onClick={() => onClick(item._id)}
            className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
          >
            <span>{item.title}</span>
            <div className="flex items-center">
              <div
                onClick={(e) => onRestore(e, item._id)}
                role="button"
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                <Undo2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <ConfirmModal onConfirm={() => onRemove(item._id)}>
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
