import React, { useCallback, useMemo } from "react";
import { makeDecoratable, withStaticProps } from "~/utils";
import { MultiFilePickerPrimitive, type MultiFilePickerPrimitiveProps } from "./primitives";
import {
    FormComponentErrorMessage,
    FormComponentNote,
    type FormComponentProps
} from "~/FormComponent";
import {
    FilePickerDescription,
    FilePickerLabel,
    ImagePreview,
    RichItemPreview,
    TextOnlyPreview
} from "~/FilePicker/primitives/components";

type MultiFilePickerProps = MultiFilePickerPrimitiveProps & FormComponentProps;

const BaseMultiFilePicker = ({
    label,
    description,
    note,
    required,
    disabled,
    validation,
    validate,
    onBlur: originalOnBlur,
    type = "area",
    ...props
}: MultiFilePickerProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
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
            {type !== "area" && (
                <>
                    <FilePickerLabel
                        label={label}
                        required={required}
                        disabled={disabled}
                        invalid={invalid}
                    />
                    <FilePickerDescription description={description} disabled={disabled} />
                </>
            )}
            <MultiFilePickerPrimitive
                {...props}
                label={label}
                description={description}
                disabled={disabled}
                invalid={invalid}
                onBlur={onBlur}
                type={type}
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

const DecoratableMultiFilePicker = makeDecoratable("MultiFilePicker", BaseMultiFilePicker);

const MultiFilePicker = withStaticProps(DecoratableMultiFilePicker, {
    Preview: {
        Image: ImagePreview,
        RichItem: RichItemPreview,
        TextOnly: TextOnlyPreview
    }
});
export { MultiFilePicker, type MultiFilePickerProps };
