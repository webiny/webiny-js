import * as React from "react";
import { FormComponentLabel, type FormComponentProps } from "~/FormComponent";

type FilePickerLabelProps = Pick<FormComponentProps, "label" | "disabled" | "required"> & {
    invalid?: boolean;
    className?: string;
};

const FilePickerLabel = ({
    label,
    required,
    disabled,
    invalid,
    className
}: FilePickerLabelProps) => {
    if (!label) {
        return null;
    }

    return (
        <FormComponentLabel
            text={label}
            required={required}
            disabled={disabled}
            className={className}
            invalid={invalid}
        />
    );
};

export { FilePickerLabel, type FilePickerLabelProps };
