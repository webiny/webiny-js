import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
import { SliderRoot, SliderThumb, SliderTrack } from "~/Slider";

type RangeSliderProps = SliderPrimitive.SliderProps;

const RangeSliderBase = ({
    min = 0,
    max = 100,
    minStepsBetweenThumbs = 1,
    defaultValue,
    ...props
}: RangeSliderProps) => {
    return (
        <SliderRoot
            min={min}
            max={max}
            defaultValue={defaultValue || [min, max]}
            minStepsBetweenThumbs={minStepsBetweenThumbs}
            {...props}
        >
            <SliderTrack />
            <SliderThumb />
            <SliderThumb />
        </SliderRoot>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", RangeSliderBase);

export { RangeSlider, type RangeSliderProps };
