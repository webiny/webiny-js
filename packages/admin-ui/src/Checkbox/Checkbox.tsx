import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { CheckboxPrimitiveProps } from "./primitives/index.js";
import { CheckboxPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentNote
} from "~/FormComponent/index.js";

type CheckboxProps = CheckboxPrimitiveProps & FormComponentProps;

const DecoratableCheckbox = ({ description, note, validation, ...props }: CheckboxProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className={"w-full"}>
            <FormComponentDescription text={description} disabled={props.disabled} />
            <CheckboxPrimitive {...props} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={props.disabled}
            />
            <FormComponentNote text={note} disabled={props.disabled} />
        </div>
    );
};
const Checkbox = makeDecoratable("Checkbox", DecoratableCheckbox);

export { Checkbox };
