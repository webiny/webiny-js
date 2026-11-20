import React, { useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils.js";
import type { IconPickerPrimitiveProps } from "./primitives/index.js";
import { IconPickerPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type IconPickerProps = IconPickerPrimitiveProps & FormComponentProps;

const DecoratableIconPicker = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    ...props
}: IconPickerProps) => {
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
            <IconPickerPrimitive id={id} {...props} disabled={disabled} invalid={invalid} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const IconPicker = makeDecoratable("IconPicker", DecoratableIconPicker);

export { IconPicker, type IconPickerProps };
