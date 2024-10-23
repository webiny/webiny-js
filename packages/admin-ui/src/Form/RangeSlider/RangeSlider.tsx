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
    <span className={"font-light text-sm leading-none"}>{props.value}</span>
);

const RangeSliderValue = makeDecoratable("RangeSliderValue", RangeSliderBaseValue);

interface RangeSliderProps extends BaseRangeSliderProps {
    label: React.ReactNode;
    valueConverter?: (value: number) => string;
}

const FormRangeSlider = ({
    value,
    defaultValue,
    onValueChange: originalOnValuesChange,
    valueConverter,
    label,
    min = 0,
    max = 100,
    ...props
}: RangeSliderProps) => {
    const initialValues = React.useMemo(() => {
        return value || defaultValue || [min, max];
    }, [value, min, max, defaultValue]);

    const { values, onValuesChange } = useRangeSlider(initialValues, originalOnValuesChange);

    const labelValues = React.useMemo(() => {
        return values.map(value => (valueConverter ? valueConverter(value) : String(value)));
    }, [values, valueConverter]);

    return (
        <div className={"w-full"}>
            <div>
                <Label text={label} weight={"light"} />
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

export { RangeSlider };
