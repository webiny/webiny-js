import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const dialogContentVariants = cva(
    [
        "fixed left-[50%] top-[50%] border-none bg-neutral-base shadow-lg focus-visible:outline-none rounded-xl text-md text-neutral-strong max-h-screen",
        "translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "focus:outline-none focus-visible:outline-none",
        "max-w-[calc(100vw-var(--spacing-lg))] max-h-[calc(100vh-var(--spacing-lg))]"
    ],
    {
        variants: {
            size: {
                sm: "w-[384px]",
                md: "w-[520px]",
                lg: "w-[640px]",
                xl: "w-[800px]",
                full: "w-screen h-screen"
            }
        },
        defaultVariants: {
            size: "md"
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
            <div
                className={cn([
                    [
                        "flex flex-col justify-between",
                        "w-full max-w-full",
                        "h-full",
                        "relative"
                    ]
                ])}
            >
                {children}
            </div>
        </DialogPrimitive.Content>
    );
});

DialogContent.displayName = DialogPrimitive.Content.displayName;

export { DialogContent };
