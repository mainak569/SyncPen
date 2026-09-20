"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { MenuIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Title } from "./title";
import { Banner } from "./banner";
import { Menu } from "./menu";
import { Publish } from "./publish";
import { CollectionConfig, CollectionTable } from "./config";

interface NavbarProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
  isCollapsed: boolean;
  onResetWidth: () => void;
}

export const Navbar = <T extends CollectionTable>({
  config,
  isCollapsed,
  onResetWidth,
}: NavbarProps<T>) => {
  const params = useParams();
  const item = useQuery(config.api.getById, {
    id: params[config.routeParam] as Id<T>,
  });

  if (item === undefined) {
    return (
      <nav className="bg-background dark:bg-[#1F1F1F] px-3 py-2 w-full flex items-center justify-between">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
      </nav>
    );
  }
  if (item === null) {
    return null;
  }

  return (
    <>
      <nav className="bg-background dark:bg-[#1F1F1F] px-3 py-2 w-full flex items-center gap-x-4">
        {isCollapsed && (
          <MenuIcon
            role="button"
            onClick={onResetWidth}
            className="h-6 w-6 text-muted-foreground"
          />
        )}
        <div className="flex items-center justify-between w-full">
          <Title config={config} initialData={item} />
          <div className="flex items-center gap-x-2">
            <Publish config={config} initialData={item} />
            <Menu config={config} itemId={item._id} />
          </div>
        </div>
      </nav>
      {item.isArchived && <Banner config={config} itemId={item._id} />}
    </>
  );
};
