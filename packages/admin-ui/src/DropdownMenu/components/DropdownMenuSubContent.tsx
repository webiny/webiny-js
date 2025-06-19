import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "~/utils";

const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
        ref={ref}
        avoidCollisions={false}
        className={cn(
            "wby-border-sm wby-border-solid wby-border-neutral-muted wby-z-[150] wby-min-w-[8rem] wby-overflow-hidden wby-rounded-md wby-border wby-bg-white wby-py-xs-plus wby-text-neutral-primary wby-shadow-lg data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0 data-[state=closed]:wby-zoom-out-95 data-[state=open]:wby-zoom-in-95 data-[side=bottom]:wby-slide-in-from-top-2 data-[side=left]:wby-slide-in-from-right-2 data-[side=right]:wby-slide-in-from-left-2 data-[side=top]:wby-slide-in-from-bottom-2",
            className
        )}
        // Added these to match alignment shown in the design.
        sideOffset={-9}
        alignOffset={-2}
        {...props}
    />
));

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export { DropdownMenuSubContent };
