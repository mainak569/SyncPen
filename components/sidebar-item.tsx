"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The plain, presentational sidebar row.
 *
 * Used for the fixed rows above the sidebar tree — Home, Search, Settings,
 * "New Note" — which carry no item and so need none of the Convex mutations
 * or Clerk hooks that `components/collection/item.tsx` binds. Keeping the two
 * apart is what lets that component require a collection config.
 */
export interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  level?: number;
  isSearch?: boolean;
}

export const SidebarItem = ({
  label,
  icon: Icon,
  onClick,
  active,
  level = 0,
  isSearch,
}: SidebarItemProps) => {
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
      <Icon className="shrink-0 h-[18px] w-[18px] mr-2 text-muted-foreground" />
      <span className="truncate">{label}</span>
      {isSearch && (
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
    </div>
  );
};
