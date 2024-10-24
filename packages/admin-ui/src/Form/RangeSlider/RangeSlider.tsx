import * as React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Label } from "~/Label";
import {
    RangeSlider as BaseRangeSlider,
    RangeSliderProps as BaseRangeSliderProps
} from "~/RangeSlider";
import { useRangeSlider } from "~/Form/RangeSlider/useRangeSlider";

/**
 * Range Slider Value
 */
interface RangeSliderValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    value: string;
}

const RangeSliderBaseValue = (props: RangeSliderValueProps) => (
    <span className={"font-normal text-sm leading-none"}>{props.value}</span>
);

const RangeSliderValue = makeDecoratable("RangeSliderValue", RangeSliderBaseValue);

interface RangeSliderProps extends BaseRangeSliderProps {
    label: React.ReactNode;
    valueConverter?: (value: number) => string;
}

const FormRangeSlider = (props: RangeSliderProps) => {
    const { values, labelValues, onValuesChange } = useRangeSlider(props);

    return (
        <div className={"w-full"}>
            <div>
                <Label text={props.label} weight={"light"} />
            </div>
            <div className={"flex flex-row items-center justify-between"}>
                <div className={"basis-1/12 pr-2"}>
                    <RangeSliderValue value={labelValues[0]} />
                </div>
                <div className={"basis-10/12"}>
                    <BaseRangeSlider {...props} value={values} onValueChange={onValuesChange} />
                </div>
                <div className={"basis-1/12 pl-2 text-right"}>
                    <RangeSliderValue value={labelValues[1]} />
                </div>
            </div>
        </div>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", FormRangeSlider);

export { RangeSlider, type RangeSliderProps };
