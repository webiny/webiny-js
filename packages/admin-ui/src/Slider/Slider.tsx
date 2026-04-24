import * as React from "react";
import { Label } from "~/Label/index.js";
import { makeDecoratable } from "~/utils.js";
import type { SliderPrimitiveProps, SliderPrimitiveRendererProps } from "./primitives/index.js";
import { SliderPrimitiveRenderer, useSlider, SliderValue } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

/**
 * Slider Renderer with side label
 */
interface SliderRendererWithSideValueProps extends SliderPrimitiveRendererProps {
    label?: React.ReactNode;
    invalid?: boolean;
    required?: boolean;
}

const SliderRendererWithSideValue = (props: SliderRendererWithSideValueProps) => {
    return (
        <div className={"w-full flex flex-row items-center justify-between"}>
            <div className={"basis-2/12 pr-sm"}>
                <Label
                    text={props.label}
                    required={props.required}
                    disabled={props.disabled}
                    invalid={props.invalid}
                    weight={"light"}
                />
            </div>
            <div className={"basis-9/12"}>
                <SliderPrimitiveRenderer {...props} />
            </div>
            <div className={"basis-1/12 pl-sm text-right"}>
                <SliderValue value={props.textValue} disabled={props.disabled} />
            </div>
        </div>
    );
};

/**
 * Slider
 */
type SliderProps = FormComponentProps &
    SliderPrimitiveProps & {
        labelPosition?: "top" | "side";
    };

const DecoratableSlider = ({
    description,
    note,
    hint,
    validation,
    labelPosition,
    ...props
}: SliderProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = validationIsValid === false;

    const { vm, changeValue, commitValue } = useSlider(props);

    if (labelPosition === "side") {
        return (
            <div className={"w-full"}>
                <FormComponentDescription text={description} disabled={props.disabled} />
                <SliderRendererWithSideValue
                    {...props}
                    {...vm}
                    invalid={invalid}
                    onValueChange={changeValue}
                    onValueCommit={commitValue}
                />
                <FormComponentErrorMessage
                    text={validationMessage}
                    invalid={invalid}
                    disabled={props.disabled}
                />
                <FormComponentNote text={note} disabled={props.disabled} />
            </div>
        );
    }

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                hint={hint}
                text={<Label text={props.label} value={vm.textValue} />}
                disabled={props.disabled}
                required={props.required}
                invalid={invalid}
            />
            <FormComponentDescription text={description} disabled={props.disabled} />
            <SliderPrimitiveRenderer
                {...props}
                {...vm}
                onValueChange={changeValue}
                onValueCommit={commitValue}
            />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={props.disabled}
            />
            <FormComponentNote text={note} disabled={props.disabled} />
        </div>
    );
};
const Slider = makeDecoratable("Slider", DecoratableSlider);

export { Slider, type SliderProps };
