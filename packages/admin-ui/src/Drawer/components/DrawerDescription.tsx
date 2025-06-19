import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn } from "~/utils";

export type DrawerDescriptionProps = React.ComponentPropsWithoutRef<
    typeof DrawerPrimitive.Description
>;

export const DrawerDescription = ({ className, ...props }: DrawerDescriptionProps) => (
    <DrawerPrimitive.Description
        {...props}
        className={cn("wby-text-sm wby-text-neutral-strong wby-text-left wby-mb-sm", className)}
    />
);
