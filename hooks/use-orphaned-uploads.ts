"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { collectUploadedFileUrls } from "@/lib/uploads";
import { deleteUploadedFiles } from "@/lib/edgestore-cleanup";

/**
 * Deletes uploads that the user removes from a note they keep.
 *
 * Deleting a note cleans up its files, but editing an image out of a note left
 * the file in EdgeStore with nothing pointing at it. Catching that means
 * noticing a URL that was in the note a moment ago and is not any more.
 *
 * Two things make a naive "it vanished, delete it" wrong, and both are handled
 * by waiting and then asking the server:
 *
 *   - Undo. Removing an image and pressing Ctrl+Z is ordinary editing, and a
 *     file deleted in between comes back as a broken image. The grace period
 *     below gives the undo time to land.
 *   - The file still being in use elsewhere — a duplicate block, the cover
 *     image, or another note it was cut and pasted into. Only a scan across
 *     the user's notes can rule that out, which is what
 *     `documents.findUnreferencedFiles` does.
 *
 * Everything is best-effort. A missed cleanup leaves a file that costs storage;
 * a wrong cleanup breaks a live page, so every ambiguous case leaks instead.
 */

// How long a URL must stay absent before it is considered gone. Long enough to
// out-wait an undo, short enough that the tab is likely still open.
const GRACE_MS = 5000;

type PublicFilesClient = Parameters<typeof deleteUploadedFiles>[0];

export const useOrphanedUploads = (publicFiles: PublicFilesClient) => {
  const convex = useConvex();

  // URLs the note contained at the last check.
  const knownRef = useRef<Set<string>>(new Set());
  // URLs that have gone missing but are not yet past the grace period.
  const pendingRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sweep = useCallback(async () => {
    timeoutRef.current = null;

    // Anything that reappeared while we waited — an undo, a re-paste — was
    // already dropped from `pending` by `track`, so this is what is still gone.
    const candidates = [...pendingRef.current];
    pendingRef.current.clear();

    if (candidates.length === 0) return;

    try {
      const unreferenced = await convex.query(
        api.documents.findUnreferencedFiles,
        { urls: candidates }
      );

      await deleteUploadedFiles(publicFiles, unreferenced);
    } catch (error) {
      // Leaves the files orphaned, which is the safe direction.
      console.error("Failed to clean up removed uploads:", error);
    }
  }, [convex, publicFiles]);

  /**
   * Call with the note's current content on every save. The first call only
   * establishes a baseline, so loading a note never deletes anything.
   */
  const track = useCallback(
    (content: string) => {
      const current = new Set(collectUploadedFileUrls(content));

      for (const url of knownRef.current) {
        if (!current.has(url)) pendingRef.current.add(url);
      }

      // A URL that is back in the note is not an orphan, whatever it looked
      // like a moment ago.
      for (const url of current) {
        pendingRef.current.delete(url);
      }

      knownRef.current = current;

      if (pendingRef.current.size === 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // Restart the clock so a burst of edits settles before anything is cut.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(sweep, GRACE_MS);
    },
    [sweep]
  );

  // Pending deletions are abandoned on unmount rather than rushed: the query
  // and delete could not be relied on to finish, and a half-done sweep is
  // worse than a leaked file.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return track;
};
