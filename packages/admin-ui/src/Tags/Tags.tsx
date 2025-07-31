import React, { useCallback, useMemo } from "react";
import { makeDecoratable, generateId } from "~/utils";
import { TagsPrimitive, type TagsPrimitiveProps } from "./primitives";

import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote,
    type FormComponentProps
} from "~/FormComponent";

type TagsProps = TagsPrimitiveProps & FormComponentProps;

const DecoratableTags = ({
    label,
    description,
    note,
    required,
    disabled,
    validation,
    validate,
    onBlur: originalOnBlur,
    ...props
}: TagsProps) => {
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
            <TagsPrimitive
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

const Tags = makeDecoratable("Tags", DecoratableTags);

export { Tags, type TagsProps };
