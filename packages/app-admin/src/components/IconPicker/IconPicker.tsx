import React from "react";

import { DefaultIcons, useIconPickerConfig, IconPickerWithConfig } from "./config";

const Picker = () => {
    const { icons } = useIconPickerConfig();

    return (
        <>
            Icon Picker
            {icons.map((icon, index) => (
                <React.Fragment key={index}>{icon.value}</React.Fragment>
            ))}
        </>
    );
};

export const IconPicker = () => {
    return (
        <>
            <DefaultIcons />
            <IconPickerWithConfig>
                <Picker />
            </IconPickerWithConfig>
        </>
    );
};
