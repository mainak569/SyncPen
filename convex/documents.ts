import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireOwnership, requireUserId } from "./model/auth";
// Relative rather than the `@/` alias: Convex bundles this directory with its
// own resolver and does not read the tsconfig path aliases the app code uses.
import { collectUploadedFileUrls } from "../lib/uploads";

/**
 * Upper bound on the rows a single list query will return.
 *
 * These queries used to `.collect()` with no limit, which reads the user's
 * entire table into memory — Convex aborts a query that reads too much, so a
 * heavy account would see the sidebar/trash/search fail outright rather than
 * degrade. An explicit cap turns that hard failure into a truncated list.
 */
const MAX_RESULTS = 500;

/**
 * Narrows `candidates` to the uploads no note of this user still references.
 *
 * The single rule for deleting a file: nothing else points at it. Both callers
 * need it — the one that removes an image from a note, and the one that
 * deletes a note outright — and they must agree, because an upload can be
 * shared. Copying or cutting an image into a second note makes one URL live in
 * two rows, so "this note owned it" is never sufficient grounds to delete.
 *
 * Callers that delete rows must run this *after* the rows are gone, so the
 * copies being removed don't count as references to themselves.
 */
const unreferencedUploads = async (
  ctx: QueryCtx,
  userId: string,
  candidates: Iterable<string>
): Promise<string[]> => {
  const unreferenced = new Set(candidates);

  if (unreferenced.size === 0) return [];

  // No isArchived filter on purpose: trashed notes still reference their
  // uploads, and restoring one must not surface a broken image.
  const documents = await ctx.db
    .query("documents")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(MAX_RESULTS);

  // A truncated scan cannot prove a URL is unused — the reference could be in
  // a row that was cut off. Leaking a file is recoverable; deleting one that
  // is still on a page is not, so bail out rather than guess.
  if (documents.length >= MAX_RESULTS) return [];

  for (const document of documents) {
    if (document.coverImage) {
      unreferenced.delete(document.coverImage);
    }

    for (const url of collectUploadedFileUrls(document.content)) {
      unreferenced.delete(url);
    }

    if (unreferenced.size === 0) break;
  }

  return [...unreferenced];
};

export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwnership(ctx, "documents", args.id);

    // if archive, doing for all of it's children
    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });
        await recursiveArchive(child._id); // recursive_call
      }
    };

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    await recursiveArchive(args.id);

    return document;
  },
});

export const getSidebar = query({
  // Named `parentId`, not `parentDocument`, so this signature is identical to
  // boards.getSidebar. The shared sidebar components are generic over the two
  // collections and can only be if the argument names match; the stored field
  // keeps its own name below.
  args: {
    parentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    /*
      ctx ( context )
      ctx.auth → Handles authentication
      ctx.db → Provides access to the Convex database
      ctx.scheduler → Allows scheduling background jobs 
    */

    // Resolves the signed-in user's id (Clerk's `subject`), throwing if the
    // caller is anonymous.
    const userId = await requireUserId(ctx);

    // fetching only those docs, which belong to the user, filtered by `parentDocument` and `isArchived` and then sorted newest to oldest
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", args.parentId)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .take(MAX_RESULTS);
    return documents; // documentId
  },
});

export const create = mutation({
  // `parentId` rather than `parentDocument`, to match boards.create — see the
  // note on getSidebar.
  args: {
    title: v.string(),
    parentId: v.optional(v.id("documents")), // `id` is stored in convex db (online)
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const documents = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentId,
      userId,
      isArchived: false,
      isPublished: false,
    });
    return documents; // documentId
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .take(MAX_RESULTS);

    return documents;
  },
});

export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { userId, existing: existingDocument } = await requireOwnership(
      ctx,
      "documents",
      args.id
    );

    // restoring all of it's child for it's parent
    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument);

      if (!parent || parent?.isArchived) {
        options.parentDocument = undefined; // Remove reference if parent is deleted or archived
      }
    }

    const document = await ctx.db.patch(args.id, options);

    await recursiveRestore(args.id);

    return document;
  },
});

// permanently remove
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { userId, existing } = await requireOwnership(
      ctx,
      "documents",
      args.id
    );

    // Uploads live in EdgeStore, which Convex has no way to call. Deleting a
    // note therefore dropped the only reference to its files and left them
    // billable in EdgeStore forever. Collect every upload in the subtree — the
    // cover image and anything embedded in the note body — and hand the list
    // back so the browser can delete the files too.
    //
    // A Set because one URL can be both a cover and an embedded block, and
    // deleting the same file twice would log a spurious failure.
    const fileUrls = new Set<string>();

    const collectFrom = (document: Doc<"documents">) => {
      if (document.coverImage) {
        fileUrls.add(document.coverImage);
      }
      for (const url of collectUploadedFileUrls(document.content)) {
        fileUrls.add(url);
      }
    };

    collectFrom(existing);

    // Deleting only the parent used to strand its whole subtree: the children
    // kept a parentDocument pointing at a row that no longer exists, so they
    // lingered in the trash with no way to reach them from their parent.
    // "Delete forever" now cascades, mirroring how archive/restore behave.
    const recursiveRemove = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        collectFrom(child);
        await recursiveRemove(child._id);
        await ctx.db.delete(child._id);
      }
    };

    await recursiveRemove(args.id);

    await ctx.db.delete(args.id);

    // Only the uploads nothing else points at. This used to return everything
    // the subtree referenced, which destroyed files that were still in use:
    // copy or cut an image into a second note and the URL lives in two rows,
    // so deleting the first note took the second note's image with it.
    //
    // Runs after the deletes above so the rows being removed no longer count
    // as references to their own files.
    return { fileUrls: await unreferencedUploads(ctx, userId, fileUrls) };
  },
});

/**
 * Of the given uploads, reports which are referenced by none of the caller's
 * notes and are therefore safe to delete from EdgeStore.
 *
 * Editing a note out from under an image is not enough on its own to justify
 * deleting the file. The same URL may still be used by a duplicate block, by a
 * cover image, or by another note the user cut-and-pasted it into, and an
 * archived note still references its images because it can be restored. Only a
 * look across every one of the user's rows can tell the difference, so the
 * decision is made here rather than from the one note being edited.
 */
export const findUnreferencedFiles = query({
  args: { urls: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    return unreferencedUploads(ctx, userId, args.urls);
  },
});

// search
export const getSearch = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .take(MAX_RESULTS);
    return documents;
  },
});

// publish
export const getById = query({
  // `id` rather than `documentId`, to match boards.getById — see getSidebar.
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);

    // Anything the caller may not see comes back as null rather than an
    // error. Throwing sent every dead link — a deleted note, an unpublished
    // share URL — to the crash screen, and the pages' "not found" branches
    // could never run. Returning the same null for "missing" and "private"
    // also avoids telling a stranger which ids exist.
    if (!document) {
      return null;
    }

    if (document.isPublished && !document.isArchived) {
      return document;
    }

    const identity = await ctx.auth.getUserIdentity();

    if (!identity || document.userId !== identity.subject) {
      return null;
    }

    return document;
  },
});

// sync doc-realtime update
export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, "documents", args.id);

    const { id, ...rest } = args;

    const document = await ctx.db.patch(args.id, {
      ...rest,
    });

    return document;
  },
});

// remove icon from title
export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, "documents", args.id);

    const document = await ctx.db.patch(args.id, {
      icon: undefined,
    });

    return document;
  },
});

// remove cover-image
export const removeCoverImage = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, "documents", args.id);

    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    });

    return document;
  },
});
