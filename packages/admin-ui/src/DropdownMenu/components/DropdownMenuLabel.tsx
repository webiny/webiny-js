import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils.js";

export interface DropdownMenuLabelProps extends React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.Label
> {
    text: React.ReactNode;
}

const DropdownMenuLabelBase = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    DropdownMenuLabelProps
>(({ className, text, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn(
            "py-sm pl-sm-extra pr-md text-sm uppercase text-neutral-strong font-semibold",
            className
        )}
        {...props}
    >
        {text}
    </DropdownMenuPrimitive.Label>
));
DropdownMenuLabelBase.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuLabel = makeDecoratable("DropdownMenuLabel", DropdownMenuLabelBase);
