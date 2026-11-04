import React, { useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils.js";
import type { RadioGroupPrimitiveProps } from "./primitives/index.js";
import { RadioGroupPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type RadioGroupProps = RadioGroupPrimitiveProps & FormComponentProps;

const DecoratableRadioGroup = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    ...props
}: RadioGroupProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);
    /* The control can't be a `<label for>` target, so it names itself after the label. */
    const labelId = useMemo(() => `${generateId()}-label`, []);

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                labelId={labelId}
                text={label}
                hint={hint}
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
            <RadioGroupPrimitive aria-labelledby={labelId} disabled={disabled} {...props} />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const RadioGroup = makeDecoratable("RadioGroup", DecoratableRadioGroup);

export { RadioGroup };
