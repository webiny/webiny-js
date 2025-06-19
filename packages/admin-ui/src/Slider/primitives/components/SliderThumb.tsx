import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { cn } from "~/utils";
import { SliderTooltip, SliderTooltipProps } from "./SliderTooltip";

type SliderThumbProps = SliderTooltipProps;

const SliderThumb = ({ textValue, showTooltip, tooltipSide }: SliderThumbProps) => (
    <SliderPrimitives.Thumb
        className={cn(
            "wby-inline-block wby-w-md wby-h-md wby-mt-xs-plus wby-rounded-xxl wby-border-md wby-transition-colors wby-outline-none",
            "wby-bg-primary-default wby-border-white",
            "hover:wby-bg-primary-strong",
            "active:wby-bg-primary-default",
            "data-[disabled]:wby-pointer-events-none data-[disabled]:wby-bg-primary-disabled"
        )}
    >
        <SliderTooltip showTooltip={showTooltip} textValue={textValue} tooltipSide={tooltipSide} />
    </SliderPrimitives.Thumb>
);

export { SliderThumb, type SliderThumbProps };
