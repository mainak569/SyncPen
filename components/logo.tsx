import Image from "next/image";
import { Poppins } from "next/font/google";

import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

const Logo = () => {
  return (
    <div className="flex shrink-0 items-center gap-x-2">
      <Image
        src="/logo.png"
        height="40"
        width="40"
        alt="Logo"
        className="dark:hidden"
      />
      <Image
        src="/logo_dark.png"
        height="40"
        width="40"
        alt="Logo"
        className="hidden dark:block"
      />
      {/* The mark alone on phones, where the navbar has no room for both. */}
      <p className={cn("hidden sm:block font-semibold", font.className)}>
        Sync
        <br />
        Pen
      </p>
    </div>
  );
};

export default Logo;
