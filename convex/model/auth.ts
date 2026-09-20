import { Doc, Id, TableNames } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";

/**
 * Shared auth/ownership guards.
 *
 * Every query and mutation in documents.ts / boards.ts repeated the same
 * "get identity, throw if missing, load the row, throw if missing, compare
 * userId, throw if not the owner" block. Centralising it keeps the checks
 * identical everywhere — the risk with the copy-pasted version was that one
 * copy quietly drifts and leaves a hole.
 */

/** Throws unless a signed-in user is making the call. Returns their id. */
export async function requireUserId(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

/**
 * Throws unless the caller is signed in AND owns the row. Returns both, so
 * callers that need the existing row don't have to re-read it.
 */
export async function requireOwnership<T extends TableNames>(
  ctx: QueryCtx,
  table: T,
  id: Id<T>
): Promise<{ userId: string; existing: Doc<T> }> {
  const userId = await requireUserId(ctx);

  const existing = await ctx.db.get(id);

  if (!existing) {
    throw new Error("Not found");
  }

  // Every table guarded here carries a userId; the cast keeps this helper
  // generic without each caller having to narrow the row itself.
  if ((existing as Doc<T> & { userId: string }).userId !== userId) {
    throw new Error("Unauthorized");
  }

  return { userId, existing };
}
