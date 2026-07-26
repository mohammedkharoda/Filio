import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Filio wordmark (public/filio-logo.png, trimmed from the source logo).
 * The mark carries the name, so nothing else should print "Filio" beside it.
 * Size it with a height class; the width follows the 504:319 aspect ratio.
 */
export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/filio-logo.png"
      alt="Filio"
      width={504}
      height={319}
      priority={priority}
      className={cn("h-8 w-auto", className)}
    />
  );
}
