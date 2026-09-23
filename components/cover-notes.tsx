"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import { useCoverImage } from "@/hooks/use-cover-image";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useEdgeStore } from "@/lib/edgestore";
import { deleteUnreferencedFiles } from "@/lib/edgestore-cleanup";
import { Skeleton } from "@/components/ui/skeleton";

interface CoverImageProps {
  url?: string;
  preview?: boolean;
}

export const CoverNotes = ({ url, preview }: CoverImageProps) => {
  const { edgestore } = useEdgeStore();
  const params = useParams();
  const coverImage = useCoverImage();
  const removeCoverImage = useMutation(api.documents.removeCoverImage);
  const convex = useConvex();

  const onRemove = async () => {
    // Drop the reference first. Deleting the file first meant an EdgeStore
    // error aborted the handler before the mutation ran, leaving the note
    // pointing at a cover the user had just asked to remove.
    await removeCoverImage({
      id: params.documentId as Id<"documents">,
    });

    // Best-effort, and only if no other note still shows the same file: an
    // orphaned upload must not surface as a failed removal, and a shared one
    // must not vanish from the note it was copied into.
    if (url) {
      await deleteUnreferencedFiles(
        edgestore.publicFiles,
        (urls) => convex.query(api.documents.findUnreferencedFiles, { urls }),
        [url]
      );
    }
  };

  return (
    <div
      className={cn(
        "relative w-full h-[35vh] group",
        !url && "h-[12vh]",
        url && "bg-muted"
      )}
    >
      {!!url && <Image src={url} fill alt="Cover" className="object-cover" />}
      {url && !preview && (
        <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2 max-[1080px]:opacity-100">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Change Cover
          </Button>
          <Button
            onClick={onRemove}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

CoverNotes.Skeleton = function CoverSkeleton() {
  return <Skeleton className="w-full h-[12vh]" />;
};
