import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const dialogContentVariants = cva(
    [
        "wby-fixed wby-left-[50%] wby-top-[50%] wby-z-50 wby-border wby-bg-neutral-base wby-shadow-lg focus-visible:outline-none wby-rounded-xl wby-text-md wby-text-neutral-strong wby-overflow-y-scroll wby-max-h-screen",
        "wby-translate-x-[-50%] wby-translate-y-[-50%] wby-duration-200 data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0 data-[state=closed]:wby-zoom-out-95 data-[state=open]:wby-zoom-in-95 data-[state=closed]:wby-slide-out-to-left-1/2 data-[state=closed]:wby-slide-out-to-top-[48%] data-[state=open]:wby-slide-in-from-left-1/2 data-[state=open]:wby-slide-in-from-top-[48%]",
        "focus:wby-outline-none focus-visible:wby-outline-none",
        "wby-w-full"
    ],
    {
        variants: {
            size: {
                sm: "wby-max-w-[480px]",
                md: "wby-max-w-[800px]"
            }
        },
        defaultVariants: {
            size: "sm"
        }
    }
);

export interface DialogContentProps
    extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
        VariantProps<typeof dialogContentVariants> {
    dismissible?: boolean;
}

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    DialogContentProps
>(({ className, dismissible, size, children, ...props }, ref) => {
    const dismissibleProps = React.useMemo<
        Pick<DialogPrimitive.DialogContentProps, "onInteractOutside" | "onEscapeKeyDown">
    >(() => {
        if (dismissible === false) {
            return {
                onInteractOutside: event => event.preventDefault(),
                onEscapeKeyDown: event => event.preventDefault()
            };
        }

        return {};
    }, [dismissible]);

    return (
        <DialogPrimitive.Content
            {...dismissibleProps}
            {...props}
            ref={ref}
            className={cn(dialogContentVariants({ size }), className)}
            // TODO: An optional accessible description to be announced when the dialog is opened. At the moment we skip this.
            aria-describedby={undefined}
        >
            {/* We needed to add this wrapper so that absolute-positioned elements can be placed */}
            {/* inside the dialog. We noticed this while showing a loader inside the dialog. */}
            <div className={"wby-flex wby-flex-col wby-relative wby-w-full wby-max-w-full"}>
                {children}
            </div>
        </DialogPrimitive.Content>
    );
});

DialogContent.displayName = DialogPrimitive.Content.displayName;

export { DialogContent };
