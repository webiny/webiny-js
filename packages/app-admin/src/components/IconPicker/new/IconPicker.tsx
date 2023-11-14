import React from "react";

import { FormComponentProps } from "@webiny/ui/types";

import { useIconRepository } from "./useIconRepository";
import { IconPickerComponent } from "./IconPickerComponent";
import { IconPickerWithConfig } from "~/components/IconPicker/config";

const IconPickerInner = (props: FormComponentProps) => {
    const repository = useIconRepository("iconPicker");

    return <IconPickerComponent repository={repository} {...props} />;
};

export const IconPicker = (props: FormComponentProps) => {
    return (
        <IconPickerWithConfig>
            <IconPickerInner {...props} />
        </IconPickerWithConfig>
    );
};
