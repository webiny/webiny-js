import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

export interface DrawerContentProps
    extends
        React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
        VariantProps<typeof drawerVariants> {
    width?: React.CSSProperties["width"];
    modal?: boolean;
}

const drawerVariants = cva(
    [
        "fixed gap-4 bg-neutral-base text-md text-neutral-strong focus-visible:outline-none shadow-lg",
        "transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        "max-w-full h-full z-drawer"
    ],
    {
        variants: {
            size: {
                sm: "w-[384px]",
                md: "w-[520px]",
                lg: "w-[640px]",
                xl: "w-[1024px]"
            },
            side: {
                left: [
                    "inset-y-0 left-0",
                    "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
                ],
                right: [
                    "inset-y-0 right-0",
                    "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
                ]
            }
        },
        defaultVariants: {
            size: "md",
            side: "right"
        }
    }
);

const DrawerContent = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Content>,
    DrawerContentProps
>(({ side, size, modal, width, className, style = {}, children, ...props }, ref) => {
    // When modal is set to false, we want to prevent the user from closing the drawer by clicking outside of it.
    // Only by clicking on "X" icon or by pressing the escape key should the drawer be closed.
    const modalProps = React.useMemo<
        Pick<DrawerPrimitive.DialogContentProps, "onInteractOutside">
    >(() => {
        if (modal === false) {
            return {
                onInteractOutside: event => event.preventDefault()
            };
        }

        return {};
    }, [modal]);

    return (
        <DrawerPrimitive.Content
            {...modalProps}
            {...props}
            ref={ref}
            className={cn(drawerVariants({ side, size }), className)}
            style={{ width, ...style }}
            // TODO: An optional accessible description to be announced when the dialog is opened. At the moment we skip this.
            aria-describedby={undefined}
        >
            <div className={"flex flex-col justify-between h-full"}>{children}</div>
        </DrawerPrimitive.Content>
    );
});

DrawerContent.displayName = DrawerPrimitive.Content.displayName;

export { DrawerContent };
