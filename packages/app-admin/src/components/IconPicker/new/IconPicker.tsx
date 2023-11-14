import React from "react";

import { useIconRepository } from "./useIconRepository";
import { IconPickerComponent, IconPickerProps } from "./IconPickerComponent";
import { IconPickerWithConfig } from "~/components/IconPicker/config";

const IconPickerInner = (props: IconPickerProps) => {
    const repository = useIconRepository("iconPicker");

    return <IconPickerComponent repository={repository} {...props} />;
};

export const IconPicker = (props: IconPickerProps) => {
    return (
        <IconPickerWithConfig>
            <IconPickerInner {...props} />
        </IconPickerWithConfig>
    );
};
