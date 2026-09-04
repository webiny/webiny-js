import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const tooltipArrowVariants = cva("", {
    variants: {
        variant: {
            // Must match the accent tooltip surface, `bg-neutral-dark`. NOT
            // `fill-neutral-dark`: that token is for icons and darkThemeBase flips it to
            // neutral-100, which would put a white arrow on a dark tooltip. The previous
            // value, "fill-bg-neutral-dark", had a doubled prefix and resolved to nothing,
            // so the arrow fell back to black -- close enough to hide the bug.
            accent: "fill-[var(--color-neutral-dark)]",
            subtle: "fill-neutral-elevated"
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
