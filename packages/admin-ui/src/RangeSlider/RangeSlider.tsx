import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
import { SliderRoot, SliderThumb, SliderTrack } from "~/Slider";

type RangeSliderProps = Omit<SliderPrimitive.SliderProps, "defaultValue">;

const RangeSliderBase = ({
    value: originalValues,
    min = 0,
    max = 100,
    minStepsBetweenThumbs = 1,
    onValueChange,
    ...props
}: RangeSliderProps) => {
    const value = originalValues || [min, max];
    const [localValues, setLocalValues] = React.useState(value);

    const handleValueChange = React.useCallback(
        (newValues: number[]) => {
            setLocalValues(newValues);
            if (onValueChange) {
                onValueChange(newValues);
            }
        },
        [onValueChange]
    );

    return (
        <SliderRoot
            min={min}
            max={max}
            minStepsBetweenThumbs={minStepsBetweenThumbs}
            value={localValues}
            onValueChange={handleValueChange}
            {...props}
        >
            <SliderTrack />
            {localValues.map((_, index) => (
                <SliderThumb key={`sliderThumb-${index}`} />
            ))}
        </SliderRoot>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", RangeSliderBase);

export { RangeSlider };
