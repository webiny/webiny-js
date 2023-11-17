import React from "react";

import { useIconRepository } from "./useIconRepository";
import { IconPickerComponent, IconPickerProps } from "./IconPickerComponent";
import { IconPickerWithConfig } from "./config";
import { IconRenderer } from "./IconRenderer";

const IconPickerInner = (props: IconPickerProps) => {
    const repository = useIconRepository();

    return <IconPickerComponent repository={repository} {...props} />;
};

const IconPicker = ({
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

IconPicker.Icon = IconRenderer;

export { IconPicker };
