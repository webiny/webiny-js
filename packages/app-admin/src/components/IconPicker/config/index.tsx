import React, { useMemo } from "react";

import { createConfigurableComponent } from "@webiny/react-properties";

import { IconPackProvider } from "./IconPackProvider";
import { IconConfig } from "./Icon";

const base = createConfigurableComponent<IconPickerConfig>("IconPicker");

export const IconPickerConfig = Object.assign(base.Config, { IconPackProvider });
export const IconPickerWithConfig = base.WithConfig;

interface IconPickerConfig {
    iconPackProvider: {
        icons: IconConfig[];
    };
}

export function useIconPickerConfig() {
    const config = base.useConfig();

    const iconPackProvider = config.iconPackProvider || {};

    return useMemo(
        () => ({
            icons: [...(iconPackProvider.icons || [])]
        }),
        [config]
    );
}

export const DefaultIcons = () => {
    return (
        <IconPickerConfig>
            <IconPickerConfig.IconPackProvider
                provider={() => [
                    { type: "emoji", name: "thumbs_up", skinTone: "", value: "👍" },
                    { type: "emoji", name: "thumbs_down", skinTone: "", value: "👎" }
                ]}
            />
            <IconPickerConfig.IconPackProvider
                provider={() => [
                    { type: "emoji", name: "grinning_face", skinTone: "", value: "😀" }
                ]}
            />
        </IconPickerConfig>
    );
};
