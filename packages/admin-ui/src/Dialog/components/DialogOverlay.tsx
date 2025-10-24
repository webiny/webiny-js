import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "~/utils.js";

export const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        id={"admin-ui.dialog-overlay"}
        ref={ref}
        className={cn(
            "fixed inset-0 bg-neutral-dark/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-backdrop",
            className
        )}
        {...props}
    />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
