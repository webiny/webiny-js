import React, { useCallback, useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils";
import { InputPrimitive, type InputPrimitiveProps } from "./InputPrimitive";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote,
    type FormComponentProps
} from "~/FormComponent";

type InputProps = InputPrimitiveProps & FormComponentProps;

const DecoratableInput = ({
    label,
    description,
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

    return (
        <div className={"wby-w-full"}>
            <FormComponentLabel
                htmlFor={id}
                text={label}
                required={required}
                disabled={disabled}
                invalid={invalid}
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
