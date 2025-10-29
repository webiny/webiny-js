import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn } from "~/utils.js";

export type DrawerTitleProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>;

export const DrawerTitle = ({ className, ...props }: DrawerTitleProps) => (
    <DrawerPrimitive.Title {...props} className={cn("text-h4 flex gap-sm", className)} />
);
