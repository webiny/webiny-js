import * as React from "react";
import { FormComponentLabel, type FormComponentProps } from "~/FormComponent";

type FormPickerLabelProps = Pick<FormComponentProps, "label" | "disabled" | "required"> & {
    invalid?: boolean;
    className?: string;
};

const FormPickerLabel = ({
    label,
    required,
    disabled,
    invalid,
    className
}: FormPickerLabelProps) => {
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

export { FormPickerLabel, type FormPickerLabelProps };
