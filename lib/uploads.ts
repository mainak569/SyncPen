/**
 * Finds the files a note has uploaded to EdgeStore.
 *
 * The only record of a note's uploads is its own content: the editor stores a
 * block per upload with the EdgeStore URL in `props.url`. Both sides of the
 * cleanup need to read that, which is why this is plain, dependency-free code
 * in `lib/` — Convex calls it when a delete cascades over descendants the
 * browser never sees, and the browser calls it to diff a note between saves.
 *
 * Everything here is defensive. `content` is a user-controlled JSON blob that
 * may be absent, malformed, or shaped by a different editor version, and none
 * of that should be able to fail a delete.
 */

/**
 * The default BlockNote block types whose `props.url` is produced by the
 * editor's `uploadFile` handler. A block type missing from this list just means
 * its file is not cleaned up — never a wrong deletion.
 */
const FILE_BLOCK_TYPES = new Set(["image", "video", "audio", "file"]);

type UnknownBlock = {
  type?: unknown;
  props?: unknown;
  children?: unknown;
};

export const collectUploadedFileUrls = (
  content: string | undefined
): string[] => {
  if (!content) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // A note whose content never parsed is a note whose uploads we cannot
    // enumerate. Losing track of a file is acceptable; failing the delete is not.
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const urls: string[] = [];

  const walk = (blocks: unknown[]) => {
    for (const block of blocks) {
      if (typeof block !== "object" || block === null) continue;

      const { type, props, children } = block as UnknownBlock;

      if (typeof type === "string" && FILE_BLOCK_TYPES.has(type)) {
        const url = (props as { url?: unknown } | undefined)?.url;
        if (typeof url === "string" && url !== "") {
          urls.push(url);
        }
      }

      // Nested blocks (list items, columns) hold uploads of their own.
      if (Array.isArray(children)) {
        walk(children);
      }
    }
  };

  walk(parsed);

  return urls;
};
