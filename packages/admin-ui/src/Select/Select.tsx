import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { SelectPrimitiveProps } from "./primitives/index.js";
import { SelectPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type SelectProps = SelectPrimitiveProps & FormComponentProps;

const DecoratableSelect = ({
    label,
    description,
    note,
    required,
    disabled,
    validation,
    ...props
}: SelectProps) => {
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
            <FormComponentDescription text={description} disabled={disabled} />
            <SelectPrimitive {...props} disabled={disabled} invalid={invalid} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const Select = makeDecoratable("Select", DecoratableSelect);

export { Select, type SelectProps };
