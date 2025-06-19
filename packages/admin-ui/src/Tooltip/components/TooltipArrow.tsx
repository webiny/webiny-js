import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const tooltipArrowVariants = cva("", {
    variants: {
        variant: {
            accent: "wby-fill-bg-neutral-dark",
            subtle: "wby-fill-neutral-base"
        }
    },
    defaultVariants: {
        variant: "accent"
    }
});

type TooltipArrowProps = TooltipPrimitive.TooltipArrowProps &
    VariantProps<typeof tooltipArrowVariants>;

const TooltipArrow = ({ variant, className, ...props }: TooltipArrowProps) => (
    <TooltipPrimitive.Arrow
        {...props}
        width={12}
        height={6}
        className={cn(tooltipArrowVariants({ variant }), className)}
    />
);

export { TooltipArrow, type TooltipArrowProps };
