import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { cn } from "~/utils.js";
import type { SliderTooltipProps } from "./SliderTooltip.js";
import { SliderTooltip } from "./SliderTooltip.js";

type SliderThumbProps = SliderTooltipProps & {
    /** The thumb is the `role=slider` element, so it carries the label's id — not the root. */
    "aria-labelledby"?: string;
};

const SliderThumb = ({
    textValue,
    showTooltip,
    tooltipSide,
    "aria-labelledby": labelledBy
}: SliderThumbProps) => (
    <SliderPrimitives.Thumb
        aria-labelledby={labelledBy}
        className={cn(
            "inline-block w-md h-md mt-xs-plus rounded-xxl border-md transition-colors outline-none",
            "bg-primary border-white",
            "hover:bg-primary-strong",
            "active:bg-primary",
            "data-disabled:pointer-events-none data-disabled:bg-primary-disabled"
        )}
    >
        <SliderTooltip showTooltip={showTooltip} textValue={textValue} tooltipSide={tooltipSide} />
    </SliderPrimitives.Thumb>
);

export { SliderThumb, type SliderThumbProps };
