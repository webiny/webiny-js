import React, { useMemo } from "react";

import { createConfigurableComponent } from "@webiny/react-properties";

import { IconPackProvider } from "./IconPackProvider";
import { IconProps } from "./Icon";

const { icons: fa6RegularIcons } = require("./fa6-regular.json");
const { icons: fa6SolidIcons } = require("./fa6-solid.json");
const emojis = require("./emojis.json");

const base = createConfigurableComponent<IconPickerConfig>("IconPicker");

export const IconPickerConfig = Object.assign(base.Config, { IconPackProvider });
export const IconPickerWithConfig = base.WithConfig;

interface IconPickerConfig {
    iconPackProvider: {
        icons: IconProps[];
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
            {/* Default Emojis Provider */}
            <IconPickerConfig.IconPackProvider
                provider={() =>
                    Object.keys(emojis).map(key => {
                        const emoji = emojis[key];
                        return {
                            type: "emoji",
                            name: emoji.slug,
                            value: key,
                            category: emoji.group,
                            skinToneSupport: emoji.skin_tone_support
                        };
                    })
                }
            />
            {/* Default Icons Providers */}
            <IconPickerConfig.IconPackProvider
                provider={() =>
                    Object.keys(fa6RegularIcons).map(key => {
                        const icon = fa6RegularIcons[key];
                        return {
                            type: "icon",
                            name: key,
                            value: icon.body,
                            width: icon.width
                        };
                    })
                }
            />
            <IconPickerConfig.IconPackProvider
                provider={() =>
                    Object.keys(fa6SolidIcons).map(key => {
                        const icon = fa6SolidIcons[key];
                        return {
                            type: "icon",
                            name: key,
                            value: icon.body,
                            width: icon.width
                        };
                    })
                }
            />

            {/* Custom Icons/Emojis Providers */}
            <IconPickerConfig.IconPackProvider
                provider={() => [{ type: "emoji", name: "testing_face", value: "😀" }]}
            />
            <IconPickerConfig.IconPackProvider
                provider={() => [
                    {
                        type: "icon",
                        name: "testing_book",
                        value: '<path fill="currentColor" d="M272 288h-64c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16h192c8.836 0 16-7.164 16-16c0-44.2-35.8-80-80-80zm-32-32c35.35 0 64-28.65 64-64s-28.65-64-64-64c-35.34 0-64 28.65-64 64s28.7 64 64 64zm256 64h-16v96h16c8.836 0 16-7.164 16-16v-64c0-8.8-7.2-16-16-16zm0-256h-16v96h16c8.8 0 16-7.2 16-16V80c0-8.84-7.2-16-16-16zm0 128h-16v96h16c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16zM384 0H96C60.65 0 32 28.65 32 64v384c0 35.35 28.65 64 64 64h288c35.35 0 64-28.65 64-64V64c0-35.35-28.7-64-64-64zm16 448c0 8.836-7.164 16-16 16H96c-8.836 0-16-7.164-16-16V64c0-8.838 7.164-16 16-16h288c8.836 0 16 7.162 16 16v384z"/>'
                    }
                ]}
            />
        </IconPickerConfig>
    );
};
