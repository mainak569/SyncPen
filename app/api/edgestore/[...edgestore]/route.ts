import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { auth } from "@clerk/nextjs/server";

type Context = { userId: string | null };

async function createContext(): Promise<Context> {
  const { userId } = await auth();
  return { userId };
}

const es = initEdgeStore.context<Context>().create();
/**
 * This is the main router for the EdgeStore buckets.
 */
const edgeStoreRouter = es.router({
  publicFiles: es
    .fileBucket()
    // Stamp the uploader onto every file so a delete can be scoped to them.
    // Without this the bucket has no notion of ownership at all.
    .metadata(({ ctx }) => ({ owner: ctx.userId }))
    .beforeUpload(({ ctx, fileInfo }) => {
      // Uploads were unrestricted: with no guard here, anyone who found the
      // endpoint could push files into the bucket without signing in.
      if (!ctx.userId) return false;

      // A replace overwrites whatever file sits at `replaceTargetUrl`, and
      // that path never consults `beforeDelete` — so allowing it would let a
      // signed-in caller clobber another user's file and sidestep the owner
      // rule below entirely. Nothing needs it: changing a cover uploads a new
      // file and removes the old one through the delete path, which does check
      // ownership. Refusing it here keeps replace from being a second, weaker
      // way to destroy a file.
      if (fileInfo.replaceTargetUrl) return false;

      return true;
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      // Previously this returned true unconditionally, which let any visitor
      // delete any uploaded file by calling the endpoint directly. Being
      // signed in is not enough either: note content can contain an image URL
      // pasted from someone else's published note, and the cleanup that runs
      // when a note is deleted would otherwise take that file with it.
      if (!ctx.userId) return false;

      const owner = fileInfo.metadata?.owner;

      // Files uploaded before `owner` metadata existed have none. They fall
      // back to the old "any signed-in user" rule so they don't become
      // permanently undeletable; tighten this to `return false` once no
      // unstamped files remain.
      if (!owner) return true;

      return owner === ctx.userId;
    }),
});
const handler = createEdgeStoreNextHandler<Context>({
  router: edgeStoreRouter,
  createContext,
});
export { handler as GET, handler as POST };
/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;
