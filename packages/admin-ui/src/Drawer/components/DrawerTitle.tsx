import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn } from "~/utils";

export type DrawerTitleProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>;

export const DrawerTitle = ({ className, ...props }: DrawerTitleProps) => (
    <DrawerPrimitive.Title
        {...props}
        className={cn("wby-text-h4 wby-flex wby-gap-sm", className)}
    />
);
