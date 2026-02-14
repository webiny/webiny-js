import React, { useCallback, useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils.js";
import { InputPrimitive, type InputPrimitiveProps } from "./InputPrimitive.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote,
    type FormComponentProps
} from "~/FormComponent/index.js";

type InputProps = InputPrimitiveProps & FormComponentProps;

const DecoratableInput = ({
    label,
    description,
    hint,
    note,
    required,
    disabled,
    validation,
    validate,
    onBlur: originalOnBlur,
    ...props
}: InputProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const id = useMemo(() => generateId(props.id), [props.id]);
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    const onBlur = useCallback(
        async (e: React.FocusEvent<HTMLInputElement>) => {
            if (validate) {
                // Since we are accessing event in an async operation, we need to persist it.
                // See https://reactjs.org/docs/events.html#event-pooling.
                e.persist();
                await validate();
            }
            originalOnBlur && originalOnBlur(e);
        },
        [validate, originalOnBlur]
    );

    // TODO: handle `type: "hidden"` so that it doesn't render wrapper divs.

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
            <InputPrimitive
                {...props}
                id={id}
                disabled={disabled}
                invalid={invalid}
                onBlur={onBlur}
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
const Input = makeDecoratable("Input", DecoratableInput);

export { Input, type InputProps };
