import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { error } from "console";

export const archive = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingBoard = await ctx.db.get(args.id);

    if (!existingBoard) {
      throw new Error("Not found");
    }

    if (existingBoard.userId !== userId) {
      throw new Error("Unauthorized");
    }

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
  args: {
    parentBoard: v.optional(v.id("boards")),
  },
  handler: async (ctx, args) => {
    /*
      ctx ( context )
      ctx.auth → Handles authentication
      ctx.db → Provides access to the Convex database
      ctx.scheduler → Allows scheduling background jobs 
    */

    const identity = await ctx.auth.getUserIdentity(); // get logged-in user

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    // `subject` which is a unique identifier assigned to the user by the authentication provider

    // fetching only those boards, which belong to the user, filtered by `parentBoard` and `isArchived` and then sorted newest to oldest
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentBoard", args.parentBoard)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();
    return boards; // boardId
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    parentBoard: v.optional(v.id("boards")), // `id` is stored in convex db (online)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not Authenticated");
    }

    const userId = identity.subject;

    const boards = await ctx.db.insert("boards", {
      title: args.title,
      parentBoard: args.parentBoard,
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
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const boards = await ctx.db
      .query("boards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return boards;
  },
});

export const restore = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingBoard = await ctx.db.get(args.id);

    if (!existingBoard) {
      throw new Error("Not found");
    }

    if (existingBoard.userId !== userId) {
      throw new Error("Unauthorized");
    }

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

    recursiveRestore(args.id);

    return board;
  },
});

// permanently remove
export const remove = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingBoard = await ctx.db.get(args.id);

    if (!existingBoard) {
      throw new Error("Not found");
    }

    if (existingBoard.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.delete(args.id);

    return board;
  },
});

// search
export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const boards = await ctx.db
      .query("boards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();
    return boards;
  },
});

// publish
export const getById = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const board = await ctx.db.get(args.boardId);

    if (!board) {
      throw new Error("Not found");
    }

    if (board.isPublished && !board.isArchived) {
      return board;
    }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    if (board.userId !== userId) {
      throw new Error("Unauthorized");
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
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const { id, ...rest } = args;

    const existingBoard = await ctx.db.get(args.id);

    if (!existingBoard) {
      throw new Error("Not found");
    }

    if (existingBoard.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.patch(args.id, {
      ...rest,
    });

    return board;
  },
});
