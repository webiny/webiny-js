import React, { useMemo } from "react";
import {
    icons as fa6RegularIconsJson,
    categories as fa6RegularCategoriesJson
} from "@iconify/json/json/fa6-regular.json";
import {
    icons as fa6SolidIconsJson,
    categories as fa6SolidCategoriesJson
} from "@iconify/json/json/fa6-solid.json";
import emojisJson from "unicode-emoji-json/data-by-emoji.json";
import { createConfigurableComponent } from "@webiny/react-properties";
import { IconPackProvider as IconPack } from "./IconPackProvider";
import { IconType } from "./IconType";
import { SimpleIconPlugin } from "../plugins/iconsPlugin";
import { EmojiPlugin } from "../plugins/emojisPlugin";
import { CustomIconPlugin } from "../plugins/customPlugin";
import { Icon } from "../types";
import { createProvider } from "@webiny/app";

type FaIconSet = {
    [key: string]: {
        body: string;
        width?: number;
    };
};

type FaCategorySet = {
    [key: string]: string[];
};

type EmojiSet = {
    [key: string]: {
        name: string;
        slug: string;
        group: string;
        emoji_version: string;
        unicode_version: string;
        skin_tone_support: boolean;
    };
};

const fa6RegularIcons: FaIconSet = fa6RegularIconsJson;
const fa6RegularCategories: FaCategorySet = fa6RegularCategoriesJson;
const fa6SolidIcons: FaIconSet = fa6SolidIconsJson;
const fa6SolidCategories: FaCategorySet = fa6SolidCategoriesJson;
const emojis: EmojiSet = emojisJson;

const base = createConfigurableComponent<IconPickerConfig>("IconPicker");

export const IconPickerConfig = Object.assign(base.Config, { IconPack, IconType });
export const IconPickerWithConfig = base.WithConfig;

export const IconPickerConfigProvider = createProvider(Original => {
    return function IconPickerConfigProvider({ children }) {
        return (
            <IconPickerWithConfig>
                <Original>{children}</Original>
            </IconPickerWithConfig>
        );
    };
});

export interface IconPackLoader {
    (): Promise<Icon[]>;
}

interface IconTypeInterface {
    name: string;
}

export { IconTypeInterface as IconType };

interface IconPickerConfig {
    iconTypes: IconTypeInterface[];
    iconPackProviders: {
        name: string;
        load: IconPackLoader;
    }[];
}

export interface IconPackProviderInterface {
    name: string;
    getIcons(): Promise<Icon[]>;
}

class IconPackProvider implements IconPackProviderInterface {
    public readonly name: string;
    private readonly loader: IconPackLoader;

    constructor(name: string, loader: IconPackLoader) {
        this.name = name;
        this.loader = loader;
    }

    getIcons(): Promise<Icon[]> {
        return this.loader();
    }
}

export function useIconPickerConfig() {
    const config = base.useConfig();

    const iconPackProviders = config.iconPackProviders || [];

    return useMemo(
        () => ({
            iconTypes: config.iconTypes || [],
            iconPackProviders: iconPackProviders.map(
                provider => new IconPackProvider(provider.name, provider.load)
            )
        }),
        [config]
    );
}

export const DefaultIcons = () => {
    return (
        <>
            <IconPickerConfig>
                {/* Default Emojis Provider */}
                <IconPickerConfig.IconPack
                    name="default_emojis"
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
                <IconPickerConfig.IconPack
                    name="fa6_regular"
                    provider={() =>
                        Object.keys(fa6RegularIcons).map(key => {
                            const icon = fa6RegularIcons[key];
                            return {
                                type: "icon",
                                name: `regular_${key}`,
                                value: icon.body,
                                category: Object.keys(fa6RegularCategories).find(categoryKey =>
                                    fa6RegularCategories[categoryKey].includes(key)
                                ),
                                width: icon.width
                            };
                        })
                    }
                />
                <IconPickerConfig.IconPack
                    name="fa6_solid"
                    provider={() =>
                        Object.keys(fa6SolidIcons).map(key => {
                            const icon = fa6SolidIcons[key];
                            return {
                                type: "icon",
                                name: `solid_${key}`,
                                value: icon.body,
                                category: Object.keys(fa6SolidCategories).find(categoryKey =>
                                    fa6SolidCategories[categoryKey].includes(key)
                                ),
                                width: icon.width
                            };
                        })
                    }
                />
            </IconPickerConfig>
            <SimpleIconPlugin />
            <EmojiPlugin />
            <CustomIconPlugin />
        </>
    );
};
