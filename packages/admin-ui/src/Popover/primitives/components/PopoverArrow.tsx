import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const popoverArrowVariants = cva("", {
    variants: {
        variant: {
            // The arrow is an SVG: it needs `fill`, not `border` (the previous
            // `border-neutral-black` did nothing, leaving it black). Tracks the accent
            // surface so the two read as one shape.
            accent: "fill-[var(--color-neutral-dark)]",
            subtle: "fill-neutral-elevated"
        }
    },
    defaultVariants: {
        variant: "subtle"
    }
});

type PopoverArrowProps = PopoverPrimitive.PopoverArrowProps &
    VariantProps<typeof popoverArrowVariants>;

const PopoverArrow = ({ variant, className, ...props }: PopoverArrowProps) => (
    <PopoverPrimitive.Arrow
        {...props}
        width={12}
        height={6}
        className={cn(popoverArrowVariants({ variant }), className)}
    />
);

export { PopoverArrow, type PopoverArrowProps };
