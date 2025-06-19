import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { SliderRoot, SliderThumb, type SliderThumbProps, SliderTrack } from "~/Slider";
import { useRangeSlider } from "./useRangeSlider";

interface RangeSliderPrimitiveRootProps
    extends Omit<SliderPrimitives.SliderProps, "min" | "max" | "value"> {
    /**
     * Array of numbers representing the current values of the range slider.
     */
    values: number[];
    /**
     * Minimum value of the range slider.
     */
    min: number;
    /**
     * Maximum value of the range slider.
     */
    max: number;
}

interface RangeSliderPrimitiveThumbProps extends Omit<SliderThumbProps, "labelValue"> {
    textValues: string[];
}

interface RangeSliderPrimitiveVm
    extends RangeSliderPrimitiveRootProps,
        Omit<RangeSliderPrimitiveThumbProps, "textValue"> {
    textValues: string[];
}

/**
 * RangeSliderRenderer
 */

const RangeSliderPrimitiveRenderer = ({
    tooltipSide,
    textValues,
    showTooltip,
    values,
    ...sliderProps
}: RangeSliderPrimitiveVm) => {
    return (
        <div className={"wby-flex wby-h-md wby-w-full"}>
            <SliderRoot {...sliderProps} value={values}>
                <SliderTrack />
                <SliderThumb
                    showTooltip={showTooltip}
                    tooltipSide={tooltipSide}
                    textValue={textValues[0]}
                />
                <SliderThumb
                    showTooltip={showTooltip}
                    tooltipSide={tooltipSide}
                    textValue={textValues[1]}
                />
            </SliderRoot>
        </div>
    );
};

/**
 * RangeSlider
 */
interface RangeSliderPrimitiveProps
    extends Omit<
        SliderPrimitives.SliderProps,
        "defaultValue" | "value" | "onValueChange" | "onValueCommit"
    > {
    onValuesChange: (values: number[]) => void;
    onValuesCommit?: (values: number[]) => void;
    showTooltip?: boolean;
    tooltipSide?: "top" | "bottom";
    transformValue?: (value: number) => string;
    values?: number[];
}

const RangeSliderPrimitive = (props: RangeSliderPrimitiveProps) => {
    const { transformValue, onValuesChange, onValuesCommit, ...restProps } = props; // Rename transformValue to _ to avoid ESLint warning
    const { vm, changeValues, commitValues } = useRangeSlider({
        ...restProps,
        transformValue,
        onValuesChange,
        onValuesCommit
    });

    return (
        <RangeSliderPrimitiveRenderer
            {...restProps}
            {...vm}
            onValueChange={changeValues}
            onValueCommit={commitValues}
        />
    );
};

export {
    RangeSliderPrimitive,
    RangeSliderPrimitiveRenderer,
    type RangeSliderPrimitiveProps,
    type RangeSliderPrimitiveVm
};
