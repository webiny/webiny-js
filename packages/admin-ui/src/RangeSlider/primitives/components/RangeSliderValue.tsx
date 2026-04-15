import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const rangeSliderValueVariants = cva("font-normal text-sm leading-none", {
    variants: {
        disabled: {
            true: "text-neutral-disabled cursor-not-allowed"
        }
    }
});

interface RangeSliderValueProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof rangeSliderValueVariants> {
    value: string;
}

const RangeSliderValue = ({ value, disabled, className }: RangeSliderValueProps) => {
    if (!value) {
        return null;
    }
    return <span className={cn(rangeSliderValueVariants({ disabled }), className)}>{value}</span>;
};

export { RangeSliderValue, type RangeSliderValueProps };
