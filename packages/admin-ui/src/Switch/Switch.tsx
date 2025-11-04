import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { SwitchPrimitiveProps } from "./primitives/index.js";
import { SwitchPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import { FormComponentErrorMessage, FormComponentNote } from "~/FormComponent/index.js";

type SwitchProps = SwitchPrimitiveProps & FormComponentProps;

const DecoratableSwitch = ({ note, validation, ...props }: SwitchProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className={"w-full"}>
            <SwitchPrimitive {...props} disabled={props.disabled} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={props.disabled}
            />
            <FormComponentNote text={note} disabled={props.disabled} />
        </div>
    );
};

const Switch = makeDecoratable("Switch", DecoratableSwitch);

export { Switch };
