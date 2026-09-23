import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ItemNotFoundProps {
  /** "note" or "board", used in the copy. */
  noun: string;
  /** Where the button goes: the owner's list, or home for a public link. */
  backHref: string;
  backLabel: string;
  /** Public share links get wording that covers "unpublished" too. */
  isPublicLink?: boolean;
}

/**
 * Shown when `getById` returns null: the item was deleted, never existed, or
 * (for share links) is no longer published. The pages used to render a bare
 * "Not found" in the corner — or, before getById stopped throwing, crash.
 */
export const ItemNotFound = ({
  noun,
  backHref,
  backLabel,
  isPublicLink,
}: ItemNotFoundProps) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-y-4 px-6 py-16 text-center">
      <Image
        src="/empty.svg"
        height={220}
        width={220}
        alt=""
        className="dark:hidden w-48 sm:w-56"
      />
      <Image
        src="/empty_dark.svg"
        height={220}
        width={220}
        alt=""
        className="hidden dark:block w-48 sm:w-56"
      />
      <h1 className="text-xl sm:text-2xl font-semibold">
        This {noun} isn&apos;t available
      </h1>
      <p className="max-w-sm text-sm sm:text-base text-muted-foreground">
        {isPublicLink
          ? `The link may be wrong, or the ${noun} was unpublished or deleted.`
          : `It may have been deleted, or the link is wrong.`}
      </p>
      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
};
