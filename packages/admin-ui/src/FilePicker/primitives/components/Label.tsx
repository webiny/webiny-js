import * as React from "react";
import { FormComponentLabel, type FormComponentProps } from "~/FormComponent/index.js";

type FilePickerLabelProps = Pick<FormComponentProps, "label" | "disabled" | "required" | "hint"> & {
    invalid?: boolean;
    className?: string;
};

const FilePickerLabel = ({
    label,
    hint,
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
            hint={hint}
            required={required}
            disabled={disabled}
            className={className}
            invalid={invalid}
        />
    );
};

export { FilePickerLabel, type FilePickerLabelProps };
