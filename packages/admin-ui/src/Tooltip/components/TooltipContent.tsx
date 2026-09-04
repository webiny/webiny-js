import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const tooltipContentVariants = cva(
    [
        "z-[var(--z-index-tooltip)] px-sm-extra py-sm max-w-64 rounded-md text-sm font-normal animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    ],
    {
        variants: {
            variant: {
                accent: "bg-neutral-dark text-neutral-light",
                subtle: "bg-neutral-elevated text-neutral-primary shadow-md"
            },
            hiddenArrow: {
                true: [
                    "data-[side=top]:mb-xs-plus",
                    "data-[side=bottom]:mt-xs-plus",
                    "data-[side=left]:mr-xs-plus",
                    "data-[side=right]:ml-xs-plus"
                ]
            }
        },
        defaultVariants: {
            variant: "accent"
        }
    }
);

type TooltipContentProps = TooltipPrimitive.TooltipContentProps &
    VariantProps<typeof tooltipContentVariants>;

const TooltipContent = ({ className, variant, hiddenArrow, ...props }: TooltipContentProps) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            collisionPadding={8}
            sideOffset={4}
            className={cn(tooltipContentVariants({ variant, hiddenArrow }), className)}
            {...props}
        />
    </TooltipPrimitive.Portal>
);

export { TooltipContent, type TooltipContentProps };
