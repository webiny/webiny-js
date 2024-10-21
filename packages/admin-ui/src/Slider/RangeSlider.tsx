import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";

import { SliderRoot, SliderThumb, SliderTrack } from "~/Slider/Slider";

const RangeSliderBase = ({
    defaultValue,
    value,
    min = 0,
    max = 100,
    onValueChange,
    ...props
}: SliderPrimitive.SliderProps) => {
    const initialValue = defaultValue || value || [min, max];
    const [localValues, setLocalValues] = React.useState(initialValue);

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
            minStepsBetweenThumbs={1}
            value={localValues}
            onValueChange={handleValueChange}
            {...props}
        >
            <SliderTrack />
            {initialValue.map((_, index) => (
                <SliderThumb key={`sliderThumb-${index}`} />
            ))}
        </SliderRoot>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", RangeSliderBase);

export { RangeSlider };
