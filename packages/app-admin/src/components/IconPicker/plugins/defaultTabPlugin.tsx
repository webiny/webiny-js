import React from "react";

import { IconPickerTabPlugin } from "~/components/IconPicker/types";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";

export const defaultTabPlugin = (): IconPickerTabPlugin => {
    return {
        type: "icon-picker-tab",
        name: "icon-picker-tab-default",
        iconType: "default",
        render(props) {
            return <IconPickerTab key={props.label} {...props}></IconPickerTab>;
        }
    };
};
