import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const popoverContentVariants = cva(
    [
        "bg-neutral-base rounded-sm shadow-md overflow-hidden outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 origin-(--radix-popover-content-transform-origin)",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    ],
    {
        variants: {
            variant: {
                accent: "bg-neutral-dark text-neutral-light border-neutral-black",
                subtle: "bg-neutral-base text-neutral-primary border-neutral-muted"
            },
            arrow: {
                true: [
                    "data-[side=top]:pb-xs-plus",
                    "data-[side=bottom]:pt-xs-plus",
                    "data-[side=left]:pr-xs-plus",
                    "data-[side=right]:pl-xs-plus"
                ],
                false: ["border-sm"]
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
