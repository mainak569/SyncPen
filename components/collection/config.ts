"use client";

import { FunctionReference } from "convex/server";
import { FileIcon, LucideIcon, Presentation } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

/**
 * Notes and boards are the same feature over two tables.
 *
 * The sidebar, trash, title, publish popover, navbar and item rows were
 * duplicated once per collection — around a thousand lines that differed only
 * in which Convex module they called, which route they pushed, and whether the
 * word was "note" or "board". Every fix had to be made twice, and the copies
 * had already drifted.
 *
 * This describes one collection. The components in this folder take a config
 * and are otherwise identical for both. Adding a third collection means adding
 * a config, not copying ten files.
 */

export type CollectionTable = "documents" | "boards";

/**
 * The Convex functions a collection must expose. The two modules deliberately
 * use matching argument names (`parentId`, `id`) so one set of typed
 * references covers both — see the comments in convex/documents.ts.
 */
type CollectionApi<T extends CollectionTable> = {
  getSidebar: FunctionReference<
    "query",
    "public",
    { parentId?: Id<T> },
    Doc<T>[]
  >;
  getTrash: FunctionReference<"query", "public", Record<string, never>, Doc<T>[]>;
  getById: FunctionReference<
    "query",
    "public",
    { id: Id<T> },
    Doc<T> | null
  >;
  create: FunctionReference<
    "mutation",
    "public",
    { title: string; parentId?: Id<T> },
    Id<T>
  >;
  archive: FunctionReference<"mutation", "public", { id: Id<T> }, unknown>;
  restore: FunctionReference<"mutation", "public", { id: Id<T> }, unknown>;
  /**
   * Notes report the uploads freed by a delete so the browser can remove them
   * from EdgeStore; boards have no uploads and return nothing.
   */
  remove: FunctionReference<
    "mutation",
    "public",
    { id: Id<T> },
    { fileUrls: string[] } | unknown
  >;
  update: FunctionReference<
    "mutation",
    "public",
    { id: Id<T>; title?: string; isPublished?: boolean },
    unknown
  >;
};

export type CollectionConfig<T extends CollectionTable = CollectionTable> = {
  table: T;
  /** Route prefix for a single item, e.g. "/documents". */
  basePath: string;
  /** Route prefix for the public read-only view, e.g. "/notesPreview". */
  previewPath: string;
  /** The dynamic route segment, so components can read it off useParams(). */
  routeParam: string;
  /** Lower-case noun used mid-sentence: "note". */
  noun: string;
  /** Capitalised noun used at the start of a sentence or label: "Note". */
  Noun: string;
  /** Icon for a row in the sidebar tree. */
  listIcon: LucideIcon;
  /** Only notes carry a per-item emoji icon and cover image. */
  hasIcon: boolean;
  /**
   * Whether deleting an item should clean up EdgeStore files. Only notes have
   * uploads; asking the boards client to do this would be a no-op at best.
   */
  cleansUpUploads: boolean;
  /**
   * The other collection, linked from the sidebar. Without it the only way
   * between notes and boards was back out through the landing page.
   */
  sibling: { label: string; href: string; icon: LucideIcon };
  api: CollectionApi<T>;
};

/**
 * Reads the uploads freed by a delete, when the collection reports any.
 *
 * `remove` is typed loosely across the two collections because only notes
 * return anything, so the shape is checked rather than asserted — a boards
 * delete simply yields nothing to clean up.
 */
export const fileUrlsFromRemove = (result: unknown): string[] | undefined => {
  if (!result || typeof result !== "object" || !("fileUrls" in result)) {
    return undefined;
  }

  const { fileUrls } = result as { fileUrls?: unknown };
  return Array.isArray(fileUrls) ? (fileUrls as string[]) : undefined;
};

export const notesCollection: CollectionConfig<"documents"> = {
  table: "documents",
  basePath: "/documents",
  previewPath: "/notesPreview",
  routeParam: "documentId",
  noun: "note",
  Noun: "Note",
  listIcon: FileIcon,
  hasIcon: true,
  cleansUpUploads: true,
  sibling: { label: "Boards", href: "/boards", icon: Presentation },
  api: api.documents,
};

export const boardsCollection: CollectionConfig<"boards"> = {
  table: "boards",
  basePath: "/boards",
  previewPath: "/boardsPreview",
  routeParam: "boardId",
  noun: "board",
  Noun: "Board",
  listIcon: Presentation,
  hasIcon: false,
  cleansUpUploads: false,
  sibling: { label: "Notes", href: "/documents", icon: FileIcon },
  api: api.boards,
};
