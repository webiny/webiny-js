import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils.js";

type AvatarImageProps = AvatarPrimitive.AvatarImageProps;

const AvatarImageBase = ({ className, ...props }: AvatarImageProps) => (
    <AvatarPrimitive.Image className={cn("aspect-square", className)} {...props} />
);

const AvatarImage = makeDecoratable("AvatarImage", AvatarImageBase);

export { AvatarImage, type AvatarImageProps };
