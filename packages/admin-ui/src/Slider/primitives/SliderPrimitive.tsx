import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { useSlider } from "./useSlider";
import { SliderRoot, SliderThumb, SliderTrack, type SliderThumbProps } from "./components";

type SliderRootProps = Omit<SliderPrimitives.SliderProps, "min"> & {
    min: number;
};

type SliderPrimitiveRendererProps = SliderRootProps & SliderThumbProps;

const SliderPrimitiveRenderer = ({
    tooltipSide,
    textValue,
    showTooltip,
    ...sliderProps
}: SliderPrimitiveVm) => {
    return (
        <div className={"wby-flex wby-h-md wby-w-full"}>
            <SliderRoot {...sliderProps}>
                <SliderTrack />
                <SliderThumb
                    textValue={textValue}
                    showTooltip={showTooltip}
                    tooltipSide={tooltipSide}
                />
            </SliderRoot>
        </div>
    );
};

interface SliderPrimitiveProps
    extends Omit<
        SliderPrimitives.SliderProps,
        "defaultValue" | "value" | "onValueChange" | "onValueCommit"
    > {
    onValueChange: (value: number) => void;
    onValueCommit?: (value: number) => void;
    showTooltip?: boolean;
    tooltipSide?: "top" | "bottom";
    transformValue?: (value: number) => string;
    value?: number;
}

type SliderPrimitiveVm = SliderRootProps & SliderThumbProps;

const SliderPrimitive = (props: SliderPrimitiveProps) => {
    const { transformValue, ...restProps } = props;
    const { vm, changeValue, commitValue } = useSlider({ ...restProps, transformValue });

    return (
        <SliderPrimitiveRenderer
            {...restProps}
            {...vm}
            onValueChange={changeValue}
            onValueCommit={commitValue}
        />
    );
};

export {
    SliderPrimitive,
    SliderPrimitiveRenderer,
    type SliderPrimitiveVm,
    type SliderPrimitiveProps,
    type SliderPrimitiveRendererProps
};
