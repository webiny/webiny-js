import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "~/utils.js";
import { ReactComponent as ChevronRight } from "@webiny/icons/chevron_right.svg";

const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "group flex cursor-default select-none items-center rounded-sm px-xs-plus text-md outline-none",
            className
        )}
        {...props}
    >
        <div
            className={cn(
                "rounded-sm gap-sm-extra group-focus:bg-neutral-dimmed flex items-center w-full px-sm py-xs-plus transition-colors",
                "[&_svg]:pointer-events-none [&_svg]:size-md [&_svg]:shrink-0 [&_svg]:fill-neutral-xstrong"
            )}
        >
            {children}
            <ChevronRight className="ml-auto" />
        </div>
    </DropdownMenuPrimitive.SubTrigger>
));

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export { DropdownMenuSubTrigger };
