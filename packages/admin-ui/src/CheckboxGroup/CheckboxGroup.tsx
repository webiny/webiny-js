import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { CheckboxGroupPrimitiveProps } from "./primitives/CheckboxGroupPrimitive.js";
import { CheckboxGroupPrimitive } from "./primitives/CheckboxGroupPrimitive.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type CheckboxGroupProps = CheckboxGroupPrimitiveProps & FormComponentProps;

const DecoratableCheckboxGroup = ({
    label,
    description,
    note,
    required,
    disabled,
    validation,
    ...props
}: CheckboxGroupProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={label}
                required={required}
                disabled={disabled}
                invalid={invalid}
            />
            <FormComponentDescription
                text={description}
                disabled={disabled}
                className={"mb-xs-plus"}
            />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
                className={"mt-none mb-xs-plus"}
            />
            <CheckboxGroupPrimitive {...props} />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const CheckboxGroup = makeDecoratable("CheckboxGroup", DecoratableCheckboxGroup);

export { CheckboxGroup };
