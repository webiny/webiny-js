import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { TogglePrimitiveProps } from "./primitives/index.js";
import { TogglePrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import { FormComponentErrorMessage, FormComponentNote } from "~/FormComponent/index.js";

type ToggleProps = TogglePrimitiveProps & FormComponentProps;

const DecoratableToggle = ({ note, validation, ...props }: ToggleProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className={"w-full"}>
            <TogglePrimitive {...props} disabled={props.disabled} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={props.disabled}
            />
            <FormComponentNote text={note} disabled={props.disabled} />
        </div>
    );
};

const Toggle = makeDecoratable("Toggle", DecoratableToggle);

export { Toggle };
