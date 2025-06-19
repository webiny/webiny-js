import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "~/utils";

export const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        id={"wby-admin-ui.dialog-overlay"}
        ref={ref}
        className={cn(
            "wby-fixed wby-inset-0 wby-z-50 wby-bg-neutral-dark/50 data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0",
            className
        )}
        {...props}
    />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
