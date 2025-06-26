import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const popoverContentVariants = cva(
    [
        "wby-z-50 wby-bg-neutral-base wby-rounded-sm wby-shadow-md wby-overflow-hidden wby-outline-none",
        "data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0 data-[state=closed]:wby-zoom-out-95 data-[state=open]:wby-zoom-in-95 wby-origin-(--radix-popover-content-transform-origin)",
        "data-[side=bottom]:wby-slide-in-from-top-2 data-[side=left]:wby-slide-in-from-right-2 data-[side=right]:wby-slide-in-from-left-2 data-[side=top]:wby-slide-in-from-bottom-2"
    ],
    {
        variants: {
            variant: {
                accent: "wby-bg-neutral-dark wby-text-neutral-light wby-border-neutral-black",
                subtle: "wby-bg-neutral-base wby-text-neutral-primary wby-border-neutral-muted"
            },
            arrow: {
                true: [
                    "data-[side=top]:wby-pb-xs-plus",
                    "data-[side=bottom]:wby-pt-xs-plus",
                    "data-[side=left]:wby-pr-xs-plus",
                    "data-[side=right]:wby-pl-xs-plus"
                ],
                false: ["wby-border-sm"]
            }
        },
        defaultVariants: {
            variant: "subtle"
        }
    }
);

type PopoverContentProps = PopoverPrimitive.PopoverContentProps &
    VariantProps<typeof popoverContentVariants>;

const PopoverContent = ({
    className,
    variant,
    arrow = false,
    align = "center",
    sideOffset = 6,
    collisionPadding = 8,
    ...props
}: PopoverContentProps) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            data-slot="popover-content"
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            className={cn(popoverContentVariants({ variant, arrow }), className)}
            {...props}
        />
    </PopoverPrimitive.Portal>
);

export { PopoverContent, type PopoverContentProps };
