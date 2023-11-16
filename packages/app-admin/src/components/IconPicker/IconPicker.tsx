import React from "react";

import { useIconRepository } from "./useIconRepository";
import { IconPickerComponent, IconPickerProps } from "./IconPickerComponent";
import { IconPickerWithConfig } from "./config";

const IconPickerInner = (props: IconPickerProps) => {
    const repository = useIconRepository("iconPicker");

    return <IconPickerComponent repository={repository} {...props} />;
};

export const IconPicker = ({
    label,
    description,
    value,
    onChange,
    validate,
    validation
}: IconPickerProps) => {
    return (
        <IconPickerWithConfig>
            <IconPickerInner
                label={label}
                description={description}
                value={value}
                onChange={onChange}
                validate={validate}
                validation={validation}
            />
        </IconPickerWithConfig>
    );
};
