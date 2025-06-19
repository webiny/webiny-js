import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "~/utils";

const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
    <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
            "wby-flex wby-flex-col wby-z-[150] wby-min-w-[8rem] wby-overflow-hidden wby-rounded-md wby-gap-xxs wby-bg-white wby-py-xs-plus wby-text-neutral-primary wby-shadow-none data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0 data-[state=closed]:wby-zoom-out-95 data-[state=open]:wby-zoom-in-95 data-[side=bottom]:wby-slide-in-from-top-2 data-[side=left]:wby-slide-in-from-right-2 data-[side=right]:wby-slide-in-from-left-2 data-[side=top]:wby-slide-in-from-bottom-2 wby-border-sm wby-border-solid wby-border-neutral-muted",
            className
        )}
        {...props}
    />
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export { DropdownMenuContent };
