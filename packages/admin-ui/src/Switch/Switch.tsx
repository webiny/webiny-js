import React, { useMemo } from "react";
import { generateId, makeDecoratable } from "~/utils.js";
import type { SwitchPrimitiveProps } from "./primitives/index.js";
import { SwitchPrimitive } from "./primitives/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote,
    type FormComponentProps
} from "~/FormComponent/index.js";

type SwitchProps = Omit<SwitchPrimitiveProps, "label"> & FormComponentProps;

const DecoratableSwitch = ({
    label,
    description,
    hint,
    note,
    required,
    disabled,
    validation,
    ...props
}: SwitchProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const id = useMemo(() => generateId(props.id), [props.id]);
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                htmlFor={id}
                text={label}
                required={required}
                disabled={disabled}
                invalid={invalid}
                hint={hint}
            />
            <FormComponentDescription text={description} disabled={disabled} />
            <SwitchPrimitive {...props} id={id} disabled={disabled} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};

const Switch = makeDecoratable("Switch", DecoratableSwitch);

export { Switch, type SwitchProps };
