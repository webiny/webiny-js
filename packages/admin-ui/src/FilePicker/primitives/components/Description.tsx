import * as React from "react";
import { FormComponentDescription, type FormComponentProps } from "~/FormComponent";

type FilePickerDescriptionProps = Pick<FormComponentProps, "description" | "disabled"> & {
    invalid?: boolean;
    className?: string;
};

const FilePickerDescription = ({
    description,
    disabled,
    className
}: FilePickerDescriptionProps) => {
    if (!description) {
        return null;
    }

    return (
        <FormComponentDescription text={description} disabled={disabled} className={className} />
    );
};

export { FilePickerDescription, type FilePickerDescriptionProps };
