"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionConfig, CollectionTable } from "./config";

interface TitleProps<T extends CollectionTable> {
  config: CollectionConfig<T>;
  initialData: Doc<T>;
}

// Matches the editor/canvas debounce: typing a 20-character title used to be
// 20 separate database writes, one per keystroke.
const SAVE_DELAY_MS = 500;

export const Title = <T extends CollectionTable>({
  config,
  initialData,
}: TitleProps<T>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useMutation(config.api.update);

  const [title, setTitle] = useState(initialData.title || "Untitled");
  const [isEditing, setIsEditing] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);

  // Writes whatever edit is still queued, if any, and cancels the timer.
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (pendingRef.current !== null) {
      update({
        id: initialData._id,
        title: pendingRef.current || "Untitled",
      });
      pendingRef.current = null;
    }
  }, [update, initialData._id]);

  // Held in a ref so the unmount cleanup below never runs early just because
  // `flush` was rebuilt.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // Don't drop the last edit if the page unmounts mid-debounce.
  useEffect(() => {
    return () => flushRef.current();
  }, []);

  const enableInput = () => {
    setTitle(initialData.title);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
    }, 0);
  };

  const disableInput = () => {
    // Leaving the field should save immediately rather than wait out the timer.
    flush();
    setIsEditing(false);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);

    pendingRef.current = value;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      disableInput();
    }
  };

  // Notes show their emoji beside the title; boards have none.
  const icon =
    config.hasIcon && "icon" in initialData
      ? (initialData as { icon?: string }).icon
      : undefined;

  return (
    <div className="flex items-center gap-x-1">
      {!!icon && <p>{icon}</p>}
      {isEditing ? (
        <Input
          ref={inputRef}
          onClick={enableInput}
          onBlur={disableInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent"
        />
      ) : (
        <Button
          onClick={enableInput}
          variant="ghost"
          size="sm"
          className="font-normal h-auto p-1"
        >
          <span className="truncate">{initialData?.title}</span>
        </Button>
      )}
    </div>
  );
};

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-md" />;
};
