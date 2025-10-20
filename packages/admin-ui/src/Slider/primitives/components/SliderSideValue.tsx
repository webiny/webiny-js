import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const sliderValueVariants = cva("font-normal text-sm leading-none", {
    variants: {
        disabled: {
            true: "text-neutral-disabled cursor-not-allowed"
        }
    }
});

interface SliderValueProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof sliderValueVariants> {
    value?: string;
}

const SliderValue = ({ value, disabled, className }: SliderValueProps) => {
    if (!value) {
        return null;
    }
    return <span className={cn(sliderValueVariants({ disabled }), className)}>{value}</span>;
};

export { SliderValue, type SliderValueProps };
