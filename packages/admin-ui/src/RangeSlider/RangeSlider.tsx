import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import type { RangeSliderPrimitiveProps } from "./primitives/index.js";
import {
    RangeSliderPrimitiveRenderer,
    RangeSliderValue,
    useRangeSlider
} from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type RangeSliderProps = RangeSliderPrimitiveProps &
    FormComponentProps & {
        label: React.ReactNode;
        valueConverter?: (value: number) => string;
    };

const DecoratableRangeSlider = ({
    description,
    note,
    hint,
    validation,
    ...props
}: RangeSliderProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = React.useMemo(() => validationIsValid === false, [validationIsValid]);
    const { onValuesChange, onValuesCommit, ...restProps } = props;
    const { vm, changeValues, commitValues } = useRangeSlider({
        ...restProps,
        onValuesChange,
        onValuesCommit
    });

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={props.label}
                hint={hint}
                required={props.required}
                disabled={props.disabled}
                invalid={invalid}
            />
            <FormComponentDescription text={description} disabled={props.disabled} />
            <div className={"flex flex-row items-center justify-between"}>
                <div className={"basis-1/12 pr-xxs"}>
                    <RangeSliderValue value={vm.textValues[0]} disabled={props.disabled} />
                </div>
                <div className={"basis-10/12"}>
                    <RangeSliderPrimitiveRenderer
                        {...restProps}
                        {...vm}
                        onValueChange={changeValues}
                        onValueCommit={commitValues}
                    />
                </div>
                <div className={"basis-1/12 pl-xxs text-right"}>
                    <RangeSliderValue value={vm.textValues[1]} disabled={props.disabled} />
                </div>
            </div>
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={props.disabled}
            />
            <FormComponentNote text={note} disabled={props.disabled} />
        </div>
    );
};

const RangeSlider = makeDecoratable("RangeSlider", DecoratableRangeSlider);

export { RangeSlider, type RangeSliderProps };
