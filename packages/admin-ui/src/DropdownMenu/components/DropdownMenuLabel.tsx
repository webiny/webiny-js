import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils";

export interface DropdownMenuLabelProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
    text: React.ReactNode;
}

const DropdownMenuLabelBase = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    DropdownMenuLabelProps
>(({ className, text, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn(
            "wby-py-sm wby-pl-sm-extra wby-pr-md wby-text-sm wby-uppercase wby-text-neutral-strong wby-font-semibold",
            className
        )}
        {...props}
    >
        {text}
    </DropdownMenuPrimitive.Label>
));
DropdownMenuLabelBase.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuLabel = makeDecoratable("DropdownMenuLabel", DropdownMenuLabelBase);
