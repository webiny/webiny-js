import * as React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Label } from "~/Label";
import { Slider as BaseSlider, SliderProps as BaseSliderProps } from "~/Slider";
import { useSlider } from "~/Form/Slider/useSlider";

/**
 * Slider Value
 */
interface SliderValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    value: string;
}

const SliderBaseValue = (props: SliderValueProps) => (
    <span className={"font-light text-sm leading-none"}>{props.value}</span>
);

const SliderValue = makeDecoratable("SliderValue", SliderBaseValue);

interface SliderProps extends BaseSliderProps {
    label: React.ReactNode;
    labelPosition?: "top" | "side";
    valueConverter?: (value: number) => string;
}

interface SliderBaseProps extends Omit<SliderProps, "labelPosition" | "valueConverter"> {
    labelValue: string;
}

/**
 * Slider with top label
 */
const SliderBaseWithTopValue = ({ label, labelValue, ...props }: SliderBaseProps) => {
    return (
        <div className={"w-full"}>
            <div className={"flex pr-1 py-1 mb-2"}>
                <Label text={label} weight={"light"} value={labelValue} />
            </div>
            <div>
                <BaseSlider {...props} />
            </div>
        </div>
    );
};

const SliderWithTopValue = makeDecoratable("SliderWithTopValue", SliderBaseWithTopValue);

/**
 * Slider with side label
 */
const SliderBaseWithSideValue = ({ label, labelValue, ...props }: SliderBaseProps) => {
    return (
        <div className={"w-full flex flex-row items-center justify-between"}>
            <div className={"basis-2/12 pr-2"}>
                {label && <Label text={label} weight={"light"} />}
            </div>
            <div className={"basis-9/12"}>
                <BaseSlider {...props} />
            </div>
            <div className={"basis-1/12 pl-2 text-right"}>
                <SliderValue value={labelValue} />
            </div>
        </div>
    );
};

const SliderWithSideValue = makeDecoratable("SliderWithSideValue", SliderBaseWithSideValue);

const FormSlider = (props: SliderProps) => {
    const { value, labelValue, onValueChange } = useSlider(props);

    if (props.labelPosition === "side") {
        return (
            <SliderWithSideValue
                {...props}
                value={value}
                labelValue={labelValue}
                onValueChange={onValueChange}
            />
        );
    }

    return (
        <SliderWithTopValue
            {...props}
            value={value}
            labelValue={labelValue}
            onValueChange={onValueChange}
        />
    );
};

const Slider = makeDecoratable("Slider", FormSlider);

export { Slider, type SliderProps };
