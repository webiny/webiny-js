import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn } from "~/utils";

export const DrawerOverlay = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Overlay
        ref={ref}
        className={cn(
            "wby-fixed wby-inset-0 wby-z-50 wby-bg-neutral-dark/50 data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0",
            className
        )}
        {...props}
    />
));

DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;
