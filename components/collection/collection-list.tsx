"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Item } from "./item";
import { cn } from "@/lib/utils";
import { CollectionConfig, CollectionTable } from "./config";

interface CollectionListProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
  parentId?: Id<T>;
  level?: number;
}

/**
 * The expandable tree of items in the sidebar. Recurses into itself for the
 * children of an expanded row.
 */
const CollectionList = <T extends CollectionTable>({
  config,
  parentId,
  level = 0,
}: CollectionListProps<T>) => {
  const params = useParams();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const onExpand = (itemId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [itemId]: !prevExpanded[itemId],
    }));
  };

  const items = useQuery(config.api.getSidebar, { parentId });

  const onRedirect = (itemId: string) => {
    router.push(`${config.basePath}/${itemId}`);
  };

  // If items is undefined (loading state), it renders skeleton placeholders
  if (items === undefined) {
    return (
      <>
        <Item.Skeleton level={level} />
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <p
        style={{
          paddingLeft: level ? `${level * 12 + 25}px` : undefined,
        }}
        className={cn(
          "hidden text-sm font-medium text-muted-foreground/80",
          expanded && "last:block",
          level === 0 && "hidden"
        )}
      >
        No {config.noun}s inside
      </p>
      {items.map((item) => (
        <div key={item._id}>
          <Item
            config={config}
            id={item._id}
            onClick={() => onRedirect(item._id)}
            label={item.title}
            icon={config.listIcon}
            // Only notes carry a per-item emoji; the boards row type has no
            // `icon` field at all, hence the guarded read.
            documentIcon={
              config.hasIcon && "icon" in item
                ? (item as { icon?: string }).icon
                : undefined
            }
            active={params[config.routeParam] === item._id}
            level={level}
            onExpand={() => onExpand(item._id)}
            expanded={expanded[item._id]}
          />
          {expanded[item._id] && (
            <CollectionList
              config={config}
              parentId={item._id}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </>
  );
};

export default CollectionList;
