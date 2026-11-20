import * as React from "react";
import { FormComponentLabel, type FormComponentProps } from "~/FormComponent/index.js";

type FilePickerLabelProps = Pick<FormComponentProps, "label" | "disabled" | "required" | "hint"> & {
    invalid?: boolean;
    className?: string;
    /** The trigger's id — so the label names the button that picks a file. */
    htmlFor?: string;
};

const FilePickerLabel = ({
    label,
    hint,
    required,
    disabled,
    invalid,
    className,
    htmlFor
}: FilePickerLabelProps) => {
    if (!label) {
        return null;
    }

    return (
        <FormComponentLabel
            htmlFor={htmlFor}
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
