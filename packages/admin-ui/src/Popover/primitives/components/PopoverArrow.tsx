import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const popoverArrowVariants = cva("", {
    variants: {
        variant: {
            accent: "border-neutral-black",
            subtle: "fill-neutral-base"
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
