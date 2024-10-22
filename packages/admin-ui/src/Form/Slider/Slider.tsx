import * as React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Label } from "~/Label";
import { Slider as BaseSlider, SliderProps as BaseSliderProps, useSlider } from "~/Slider";

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
                <Label text={label} weight={"light"} />
                <SliderValue value={labelValue} />
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

const FormSlider = ({
    value: originalValue,
    onValueChange: originalOnValueChange,
    valueConverter,
    label,
    labelPosition = "top",
    ...props
}: SliderProps) => {
    const initialValue =
        originalValue !== undefined
            ? originalValue // Use the original value if defined.
            : props.min ?? 0; // Fallback to `min`, or 0 if both are undefined.
    const [value, onValueChange] = useSlider(initialValue, originalOnValueChange);

    const labelValue = React.useMemo(() => {
        return valueConverter ? valueConverter(value) : String(value);
    }, [value, valueConverter]);

    if (labelPosition === "side") {
        return (
            <SliderWithSideValue
                value={value}
                label={label}
                labelValue={labelValue}
                onValueChange={onValueChange}
                {...props}
            />
        );
    }

    return (
        <SliderWithTopValue
            value={value}
            labelValue={labelValue}
            label={label}
            onValueChange={onValueChange}
            {...props}
        />
    );
};

const Slider = makeDecoratable("Slider", FormSlider);

export { Slider };
