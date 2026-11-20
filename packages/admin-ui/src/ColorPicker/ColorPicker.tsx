import React, { useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils.js";
import type { ColorPickerPrimitiveProps } from "./primitives/index.js";
import { ColorPickerPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type ColorPickerProps = ColorPickerPrimitiveProps & FormComponentProps;

const DecoratableIconPicker = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    ...props
}: ColorPickerProps) => {
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
            <FormComponentDescription text={description} disabled={disabled} />
            <ColorPickerPrimitive
                aria-labelledby={labelId}
                {...props}
                disabled={disabled}
                invalid={invalid}
            />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const ColorPicker = makeDecoratable("ColorPicker", DecoratableIconPicker);

export { ColorPicker, type ColorPickerProps };
