import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { Text } from "~/Text/index.js";

const sliderTooltipVariants = cva(
    ["px-xs-plus py-xxs rounded-sm absolute left-1/2 -translate-x-1/2", "bg-neutral-muted"],
    {
        variants: {
            side: {
                top: "bottom-8",
                bottom: "top-8"
            }
        },
        defaultVariants: {
            side: "bottom"
        }
    }
);

type SliderTooltipProps = VariantProps<typeof sliderTooltipVariants> & {
    textValue: string;
    showTooltip?: boolean;
    tooltipSide?: "top" | "bottom";
};

const SliderTooltip = ({ textValue, showTooltip, tooltipSide }: SliderTooltipProps) => {
    if (!textValue || !showTooltip) {
        return null;
    }

    return (
        <div className={cn(sliderTooltipVariants({ side: tooltipSide }))}>
            <Text size={"sm"} as={"div"}>
                {textValue}
            </Text>
        </div>
    );
};

export { SliderTooltip, type SliderTooltipProps };
