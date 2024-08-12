import React from "react";
import { Overlay as OverlayPrimitive } from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";

export const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof OverlayPrimitive>,
    React.ComponentPropsWithoutRef<typeof OverlayPrimitive>
>(({ className, ...props }, ref) => (
    <OverlayPrimitive
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-background-muted data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
));
DialogOverlay.displayName = OverlayPrimitive.displayName;
