"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  LucideIcon,
  MoreHorizontal,
  Plus,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/clerk-react";
import { CollectionConfig, CollectionTable } from "./config";

interface ItemProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
  id: Id<T>;
  /** The item's own emoji, shown instead of `icon`. Notes only. */
  documentIcon?: string;
  active?: boolean;
  expanded?: boolean;
  level?: number;
  onExpand?: () => void;
  label: string;
  onClick?: () => void;
  icon: LucideIcon;
}

/**
 * A row for one item in the sidebar tree: expandable, and able to create a
 * child or archive itself.
 *
 * The fixed rows above the tree (Home, Search, Settings) are plain and carry
 * no item, so they use `components/sidebar-item.tsx` instead. Keeping them out
 * of here is what lets `config` be required — the Convex mutations below are
 * hooks and cannot be bound conditionally.
 */
export const Item = <T extends CollectionTable>({
  config,
  id,
  label,
  onClick,
  icon: Icon,
  active,
  documentIcon,
  level = 0,
  onExpand,
  expanded,
}: ItemProps<T>) => {
  const { user } = useUser();
  const router = useRouter();

  const create = useMutation(config.api.create);
  const archive = useMutation(config.api.archive);

  const onArchive = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();

    const promise = archive({ id }).then(() => router.push(config.basePath));

    toast.promise(promise, {
      loading: "Moving to trash...",
      success: `${config.Noun} moved to trash!`,
      error: `Failed to archive ${config.noun}.`,
    });
  };

  const handleExpand = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation();
    onExpand?.();
  };

  const onCreate = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();

    const promise = create({ title: "Untitled", parentId: id }).then(
      (itemId) => {
        if (!expanded) {
          onExpand?.();
        }
        router.push(`${config.basePath}/${itemId}`);
      }
    );

    toast.promise(promise, {
      loading: `Creating a new ${config.noun}...`,
      success: `New ${config.noun} created!`,
      error: `Failed to create a new ${config.noun}.`,
    });
  };

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <div
      onClick={onClick}
      role="button"
      style={{ paddingLeft: level ? `${level * 12 + 12}px` : "12px" }}
      className={cn(
        "group min-h-[27px] text-sm py-1 pr-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium",
        active && "bg-primary/5 text-primary"
      )}
    >
      <div
        role="button"
        className="h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1"
        onClick={handleExpand}
      >
        <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>
      {documentIcon ? (
        <div className="shrink-0 mr-2 text-[18px]">{documentIcon}</div>
      ) : (
        <Icon className="shrink-0 h-[18px] w-[18px] mr-2 text-muted-foreground" />
      )}
      <span className="truncate">{label}</span>
      <div className="ml-auto flex items-center gap-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
              <div
                role="button"
                className="opacity-0 group-hover:opacity-100 h-full ml-auto
             rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 max-[1080px]:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60"
              align="start"
              side="right"
              forceMount
            >
              <DropdownMenuItem onClick={onArchive}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="text-xs text-muted-foreground p-2">
                Last edited by: {user?.fullName}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div
            role="button"
            onClick={onCreate}
            className="opacity-0 group-hover:opacity-100 h-full ml-auto
    rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 max-[1080px]:opacity-100"
          >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

// provides a skeleton loader for a smoother UX
// Used for loading states (e.g., when fetching items from an API)
// It renders a small skeleton animation for an icon and a short label
Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  return (
    <div
      style={{
        paddingLeft: level ? `${level * 12 + 25}px` : "12px",
      }}
      className="flex gap-x-2 py-[3px]"
    >
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  );
};
