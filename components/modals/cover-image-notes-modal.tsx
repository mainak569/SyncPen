import { useConvex, useMutation } from "convex/react";
import { useState } from "react";
import { useParams } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCoverImage } from "@/hooks/use-cover-image";
import { SingleImageDropzone } from "@/components/single-image-dropzone";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { deleteUnreferencedFiles } from "@/lib/edgestore-cleanup";
import { Id } from "@/convex/_generated/dataModel";

export const CoverImageNotesModal = () => {
  const params = useParams();
  const update = useMutation(api.documents.update);
  const convex = useConvex();
  const coverImage = useCoverImage();
  const { edgestore } = useEdgeStore();

  const [file, setFile] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClose = () => {
    setFile(undefined);
    setIsSubmitting(false);
    coverImage.onClose();
  };

  const onChange = async (file?: File) => {
    if (!file) return;

    setIsSubmitting(true);
    setFile(file);

    const documentId = params.documentId as Id<"documents">;

    try {
      // The cover being replaced, read from the note itself rather than from
      // the dialog store: the store only knows about it when the dialog was
      // opened with "Change Cover", and a stale store left the old file
      // behind in storage.
      const previousUrl = (
        await convex.query(api.documents.getById, { id: documentId })
      )?.coverImage;

      // Deliberately not an EdgeStore replace. A replace overwrites the old
      // file in place without going through `beforeDelete`, so it is a way to
      // destroy a file that skips the ownership check; the server now refuses
      // it. Uploading a new file and deleting the old one keeps every deletion
      // on the one checked path.
      const res = await edgestore.publicFiles.upload({ file });

      await update({
        id: documentId,
        coverImage: res.url,
      });

      // Only once the note points at the new file, so a failure here orphans
      // the old upload rather than leaving the note showing a deleted image.
      // …and only if no other note still shows it.
      if (previousUrl) {
        await deleteUnreferencedFiles(
          edgestore.publicFiles,
          (urls) => convex.query(api.documents.findUnreferencedFiles, { urls }),
          [previousUrl]
        );
      }

      onClose();
    } catch (error) {
      // Without this the dropzone stayed disabled and the dialog stuck open
      // on any failure, with no way back other than a reload.
      console.error("Failed to set cover image:", error);
      setFile(undefined);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Cover Image
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upload an image to use as this note’s cover.
          </DialogDescription>
        </DialogHeader>
        <SingleImageDropzone
          className="w-full outline-none"
          disabled={isSubmitting}
          value={file}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  );
};
