"use client";

import { useEffect, useState } from "react";
import { Presentation } from "lucide-react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";

import { defaultFilter } from "cmdk";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useSearch } from "@/hooks/use-search";
import { api } from "@/convex/_generated/api";

const SearchCommand = () => {
  const { user } = useUser();
  const router = useRouter();
  const boards = useQuery(api.boards.getSearch);
  const [isMounted, setIsMounted] = useState(false);

  const toggle = useSearch((store) => store.toggle);
  const isOpen = useSearch((store) => store.isOpen);
  const onClose = useSearch((store) => store.onClose);

  useEffect(() => {
    setIsMounted(true); // prevent server side rendering
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const onSelect = (id: string) => {
    router.push(`/boards/${id}`);
    onClose();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={onClose}
      // Match on the title alone. The item value has to be the id so that
      // notes sharing a title stay distinct, but the default filter
      // fuzzy-matches the value too, so "child" used to hit every note whose
      // random id happened to contain those letters in order.
      filter={(_value, search, keywords) =>
        defaultFilter(keywords?.join(" ") ?? "", search)
      }
    >
      <CommandInput placeholder={`Search ${user?.fullName}'s SyncPen...`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Boards">
          {boards?.map((document) => (
            <CommandItem
              // cmdk reads `keywords` only on mount, so remount on rename or
              // a title changed from another tab would search the old name.
              key={`${document._id}-${document.title}`}
              value={document._id}
              keywords={[document.title]}
              title={document.title}
              onSelect={onSelect}
            >
              <Presentation className="mr-2 h-4 w-4" />
              <span>{document.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default SearchCommand;
