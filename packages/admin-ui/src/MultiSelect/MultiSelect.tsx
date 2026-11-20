import React, { useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils.js";
import type { MultiSelectPrimitiveProps } from "./primitives/index.js";
import { MultiSelectPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type MultiSelectProps = MultiSelectPrimitiveProps & FormComponentProps;

const DecoratableMultiSelect = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    ...props
}: MultiSelectProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);
    /* The label names the control, so `getByLabelText` / `{ label }` find it. */
    const id = useMemo(() => generateId(props.id), [props.id]);

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                htmlFor={id}
                text={label}
                hint={hint}
                required={required}
                disabled={disabled}
                invalid={invalid}
            />
            <FormComponentDescription text={description} disabled={disabled} />
            <MultiSelectPrimitive id={id} {...props} disabled={disabled} invalid={invalid} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const MultiSelect = makeDecoratable("MultiSelect", DecoratableMultiSelect);

export { MultiSelect, type MultiSelectProps };
