import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils.js";

type AvatarFallbackProps = AvatarPrimitive.AvatarFallbackProps;

const AvatarFallbackBase = ({ className, ...props }: AvatarFallbackProps) => (
    <AvatarPrimitive.Fallback
        className={cn(
            "flex h-full w-full items-center justify-center rounded-sm",
            className
        )}
        {...props}
    />
);

const AvatarFallback = makeDecoratable("AvatarFallback", AvatarFallbackBase);

export { AvatarFallback, type AvatarFallbackProps };
