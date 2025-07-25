import * as React from "react";
import { FormComponentDescription, type FormComponentProps } from "~/FormComponent";

type FormPickerDescriptionProps = Pick<FormComponentProps, "description" | "disabled"> & {
    invalid?: boolean;
    className?: string;
};

const FormPickerDescription = ({
    description,
    disabled,
    className
}: FormPickerDescriptionProps) => {
    return (
        <FormComponentDescription text={description} disabled={disabled} className={className} />
    );
};

export { FormPickerDescription, type FormPickerDescriptionProps };
