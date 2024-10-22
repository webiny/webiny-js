import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
import { SliderRoot, SliderThumb, SliderTrack } from "~/Slider";
import { useRangeSlider } from "./useRangeSlider";

type RangeSliderProps = Omit<SliderPrimitive.SliderProps, "defaultValue">;

const RangeSliderBase = ({
    value: originalValues,
    onValueChange: originalOnValuesChange,
    min = 0,
    max = 100,
    minStepsBetweenThumbs = 1,
    ...props
}: RangeSliderProps) => {
    const initialValues = originalValues || [min, max];
    const { values, onValuesChange } = useRangeSlider(initialValues, originalOnValuesChange);

    return (
        <SliderRoot
            min={min}
            max={max}
            minStepsBetweenThumbs={minStepsBetweenThumbs}
            value={values}
            onValueChange={onValuesChange}
            {...props}
        >
            <SliderTrack />
            {values.map((_, index) => (
                <SliderThumb key={`sliderThumb-${index}`} />
            ))}
        </SliderRoot>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", RangeSliderBase);

export { RangeSlider, type RangeSliderProps };
