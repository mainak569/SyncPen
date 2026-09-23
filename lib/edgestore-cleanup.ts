/**
 * Convex runs nowhere near EdgeStore and cannot make outbound calls to it, so
 * deleting a note can only delete the row. `documents.remove` hands back the
 * uploads belonging to every row it removed — cover images and files embedded
 * in the note body — and the browser, which does hold an EdgeStore client,
 * deletes them here.
 *
 * Deliberately best-effort: failing to delete a file only leaves it orphaned in
 * storage, which must not turn an otherwise-successful note delete into an
 * error toast. Note content can also carry a URL pasted from someone else's
 * note; the bucket's `beforeDelete` rejects those, and the rejection lands in
 * the catch below rather than destroying another user's file.
 */

type PublicFilesClient = {
  delete: (options: { url: string }) => Promise<unknown>;
};

export const deleteUploadedFiles = async (
  publicFiles: PublicFilesClient,
  fileUrls: string[] | undefined
): Promise<void> => {
  if (!fileUrls?.length) return;

  await Promise.all(
    fileUrls.map(async (url) => {
      try {
        await publicFiles.delete({ url });
      } catch (error) {
        console.error("Failed to delete upload from storage:", url, error);
      }
    })
  );
};

type UnreferencedQuery = (urls: string[]) => Promise<string[]>;

/**
 * Deletes only those of `fileUrls` that no note of the user still references.
 *
 * For paths that drop one reference to a file — replacing or removing a cover
 * — rather than deleting whole rows. The file may still be used elsewhere (the
 * same image pasted into another note), so "this note let go of it" is never
 * enough on its own; the server-side scan decides. Call it after the mutation
 * that drops the reference, so the reference being removed doesn't count.
 */
export const deleteUnreferencedFiles = async (
  publicFiles: PublicFilesClient,
  findUnreferenced: UnreferencedQuery,
  fileUrls: string[]
): Promise<void> => {
  if (fileUrls.length === 0) return;

  try {
    await deleteUploadedFiles(publicFiles, await findUnreferenced(fileUrls));
  } catch (error) {
    // Leaks the file, which is the safe direction.
    console.error("Failed to check uploads before deleting:", error);
  }
};
