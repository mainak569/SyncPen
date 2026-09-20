"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";

import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionConfig, CollectionTable } from "./config";

interface MenuProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
  itemId: Id<T>;
}

/** The "..." menu in the navbar, for archiving the open item. */
export const Menu = <T extends CollectionTable>({
  config,
  itemId,
}: MenuProps<T>) => {
  const router = useRouter();
  const user = useUser();
  const archive = useMutation(config.api.archive);

  const onArchive = () => {
    const promise = archive({ id: itemId });

    toast.promise(promise, {
      loading: "Moving to trash...",
      success: `${config.Noun} moved to trash!`,
      error: `Failed to archive ${config.noun}.`,
    });

    router.push(config.basePath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60"
        align="end"
        alignOffset={8}
        forceMount
      >
        <DropdownMenuItem onClick={onArchive}>
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="text-xs text-muted-foreground p-2">
          Last edited by:{" "}
          {user?.user?.externalAccounts?.[0]?.firstName ?? "Unknown"}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-6 w-6" />;
};
