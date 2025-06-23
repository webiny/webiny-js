import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

export interface DrawerContentProps
    extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
        VariantProps<typeof drawerVariants> {
    width?: React.CSSProperties["width"];
    modal?: boolean;
}

const drawerVariants = cva(
    [
        "wby-fixed wby-z-50 wby-gap-4 wby-bg-neutral-base wby-text-md wby-text-neutral-strong focus-visible:outline-none wby-shadow-lg",
        "wby-transition wby-ease-in-out data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-duration-300 data-[state=open]:wby-duration-500",
        "wby-max-w-full wby-h-full"
    ],
    {
        variants: {
            size: {
                sm: "wby-w-[384px]",
                md: "wby-w-[520px]",
                lg: "wby-w-[640px]",
                xl: "wby-w-[1024px]"
            },
            side: {
                left: [
                    "wby-inset-y-0 wby-left-0",
                    "data-[state=closed]:wby-slide-out-to-left data-[state=open]:wby-slide-in-from-left"
                ],
                right: [
                    "wby-inset-y-0 wby-right-0",
                    "data-[state=closed]:wby-slide-out-to-right data-[state=open]:wby-slide-in-from-right"
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
            <div className={"wby-flex wby-flex-col wby-justify-between wby-h-full"}>{children}</div>
        </DrawerPrimitive.Content>
    );
});

DrawerContent.displayName = DrawerPrimitive.Content.displayName;

export { DrawerContent };
