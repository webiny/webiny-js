import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn } from "~/utils.js";

export type DrawerDescriptionProps = React.ComponentPropsWithoutRef<
    typeof DrawerPrimitive.Description
>;

export const DrawerDescription = ({ className, ...props }: DrawerDescriptionProps) => (
    <DrawerPrimitive.Description
        {...props}
        className={cn("text-sm text-neutral-strong text-left mb-sm", className)}
    />
);
