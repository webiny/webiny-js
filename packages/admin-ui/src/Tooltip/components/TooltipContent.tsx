import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const tooltipContentVariants = cva(
    [
        "wby-z-50 wby-px-sm-extra wby-py-sm wby-max-w-64 wby-rounded-md wby-text-sm wby-font-normal wby-animate-in wby-fade-in-0 wby-zoom-in-95",
        "data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=closed]:wby-zoom-out-95",
        "data-[side=bottom]:wby-slide-in-from-top-2 data-[side=left]:wby-slide-in-from-right-2 data-[side=right]:wby-slide-in-from-left-2 data-[side=top]:wby-slide-in-from-bottom-2"
    ],
    {
        variants: {
            variant: {
                accent: "wby-bg-neutral-dark wby-text-neutral-light",
                subtle: "wby-bg-neutral-base wby-text-neutral-primary wby-shadow-md"
            },
            hiddenArrow: {
                true: [
                    "data-[side=top]:wby-mb-xs-plus",
                    "data-[side=bottom]:wby-mt-xs-plus",
                    "data-[side=left]:wby-mr-xs-plus",
                    "data-[side=right]:wby-ml-xs-plus"
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
