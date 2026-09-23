import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireOwnership, requireUserId } from "./model/auth";

/**
 * Upper bound on the rows a single list query will return.
 *
 * These queries used to `.collect()` with no limit, which reads the user's
 * entire table into memory — Convex aborts a query that reads too much, so a
 * heavy account would see the sidebar/trash/search fail outright rather than
 * degrade. An explicit cap turns that hard failure into a truncated list.
 */
const MAX_RESULTS = 500;

export const archive = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwnership(ctx, "boards", args.id);

    // if archive, doing for all of it's children
    const recursiveArchive = async (boardId: Id<"boards">) => {
      const children = await ctx.db
        .query("boards")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentBoard", boardId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });
        await recursiveArchive(child._id); // recursive_call
      }
    };

    const board = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    await recursiveArchive(args.id);

    return board;
  },
});

export const getSidebar = query({
  // Named `parentId`, not `parentBoard`, so this signature is identical to
  // documents.getSidebar. The shared sidebar components are generic over the
  // two collections and can only be if the argument names match; the stored
  // field keeps its own name below.
  args: {
    parentId: v.optional(v.id("boards")),
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

    // fetching only those boards, which belong to the user, filtered by `parentBoard` and `isArchived` and then sorted newest to oldest
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentBoard", args.parentId)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .take(MAX_RESULTS);
    return boards; // boardId
  },
});

export const create = mutation({
  // `parentId` rather than `parentBoard`, to match documents.create — see the
  // note on getSidebar.
  args: {
    title: v.string(),
    parentId: v.optional(v.id("boards")), // `id` is stored in convex db (online)
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const boards = await ctx.db.insert("boards", {
      title: args.title,
      parentBoard: args.parentId,
      userId,
      isArchived: false,
      isPublished: false,
      content: JSON.stringify({ elements: [], appState: {} }),
    });
    return boards; // boardId
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const boards = await ctx.db
      .query("boards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .take(MAX_RESULTS);

    return boards;
  },
});

export const restore = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const { userId, existing: existingBoard } = await requireOwnership(
      ctx,
      "boards",
      args.id
    );

    // restoring all of it's child for it's parent
    const recursiveRestore = async (boardId: Id<"boards">) => {
      const children = await ctx.db
        .query("boards")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentBoard", boardId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"boards">> = {
      isArchived: false,
    };

    if (existingBoard.parentBoard) {
      const parent = await ctx.db.get(existingBoard.parentBoard);

      if (!parent || parent?.isArchived) {
        options.parentBoard = undefined; // Remove reference if parent is deleted or archived
      }
    }

    const board = await ctx.db.patch(args.id, options);

    await recursiveRestore(args.id);

    return board;
  },
});

// permanently remove
export const remove = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwnership(ctx, "boards", args.id);

    // Deleting only the parent used to strand its whole subtree: the children
    // kept a parentBoard pointing at a row that no longer exists, so they
    // lingered in the trash with no way to reach them from their parent.
    // "Delete forever" now cascades, mirroring how archive/restore behave.
    const recursiveRemove = async (boardId: Id<"boards">) => {
      const children = await ctx.db
        .query("boards")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentBoard", boardId)
        )
        .collect();

      for (const child of children) {
        await recursiveRemove(child._id);
        await ctx.db.delete(child._id);
      }
    };

    await recursiveRemove(args.id);

    const board = await ctx.db.delete(args.id);

    return board;
  },
});

// search
export const getSearch = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const boards = await ctx.db
      .query("boards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .take(MAX_RESULTS);
    return boards;
  },
});

// publish
export const getById = query({
  // `id` rather than `boardId`, to match documents.getById — see getSidebar.
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.id);

    // Anything the caller may not see comes back as null rather than an
    // error. Throwing sent every dead link — a deleted board, an unpublished
    // share URL — to the crash screen, and the pages' "not found" branches
    // could never run. Returning the same null for "missing" and "private"
    // also avoids telling a stranger which ids exist.
    if (!board) {
      return null;
    }

    if (board.isPublished && !board.isArchived) {
      return board;
    }

    const identity = await ctx.auth.getUserIdentity();

    if (!identity || board.userId !== identity.subject) {
      return null;
    }

    return board;
  },
});

// sync board-realtime update
export const update = mutation({
  args: {
    id: v.id("boards"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    // coverImage: v.optional(v.string()),
    // icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, "boards", args.id);

    const { id, ...rest } = args;

    const board = await ctx.db.patch(args.id, {
      ...rest,
    });

    return board;
  },
});
