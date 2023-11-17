import React from "react";

import { IconPickerPlugin } from "~/components/IconPicker/types";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";

export const customPlugin = (): IconPickerPlugin => {
    return {
        type: "admin-icon-picker",
        name: "admin-icon-picker-custom",
        iconType: "custom",
        renderIcon(icon, size) {
            return <img width={size} height={size} src={icon.value} alt={icon.name} />;
        },
        renderTab(props) {
            return <IconPickerTab key={props.label} {...props}></IconPickerTab>;
        }
    };
};
