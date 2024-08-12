import React from "react";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { Close, Content as ContentPrimitive, Portal } from "@radix-ui/react-dialog";

import { cn } from "~/lib/utils";
import { DialogOverlay } from "~/components";

export const DialogContent = React.forwardRef<
    React.ElementRef<typeof ContentPrimitive>,
    React.ComponentPropsWithoutRef<typeof ContentPrimitive>
>(({ className, children, ...props }, ref) => (
    <Portal>
        <DialogOverlay />
        <ContentPrimitive
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-pale bg-background-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
                className
            )}
            {...props}
        >
            {children}
            <Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
                <span className="h-4 w-4 fill-dark">
                    <CloseIcon />
                </span>
                <span className="sr-only">Close</span>
            </Close>
        </ContentPrimitive>
    </Portal>
));
DialogContent.displayName = ContentPrimitive.displayName;
