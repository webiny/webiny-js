import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
import { SliderRoot, SliderThumb, SliderTrack } from "~/Slider";

type RangeSliderProps = SliderPrimitive.SliderProps & {
    onValueConvert?: (value: number) => string;
    showTooltip?: boolean;
    tooltipSide?: "top" | "bottom";
};

const RangeSliderBase = ({
    min = 0,
    max = 100,
    minStepsBetweenThumbs = 1,
    defaultValue,
    value,
    onValueChange,
    onValueCommit,
    onValueConvert,
    showTooltip,
    tooltipSide,
    ...props
}: RangeSliderProps) => {
    const [showTooltipValue, setShowTooltipValue] = React.useState(false);
    const [localValues, setLocalValues] = React.useState(defaultValue || value || [min, max]);

    const handleValueChange = React.useCallback(
        (newValue: number[]) => {
            setShowTooltipValue(() => !!showTooltip);
            setLocalValues(newValue);
            onValueChange?.(newValue);
        },
        [onValueChange, showTooltip]
    );

    const handleValueCommit = React.useCallback(
        (newValue: number[]) => {
            setShowTooltipValue(false);
            onValueCommit?.(newValue);
        },
        [onValueCommit]
    );

    const handleValueConvert = React.useCallback(
        (value?: number) => {
            if (!value) {
                return;
            }

            if (!onValueConvert) {
                return String(value);
            }

            return onValueConvert(value);
        },
        [onValueConvert]
    );

    return (
        <SliderRoot
            {...props}
            min={min}
            max={max}
            defaultValue={defaultValue || [min, max]}
            minStepsBetweenThumbs={minStepsBetweenThumbs}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
        >
            <SliderTrack />
            <SliderThumb
                value={handleValueConvert(localValues[0])}
                tooltipSide={tooltipSide}
                showTooltip={showTooltipValue}
            />
            <SliderThumb
                value={handleValueConvert(localValues[1])}
                tooltipSide={tooltipSide}
                showTooltip={showTooltipValue}
            />
        </SliderRoot>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", RangeSliderBase);

export { RangeSlider, type RangeSliderProps };
