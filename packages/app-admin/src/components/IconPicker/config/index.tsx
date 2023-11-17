import React, { useMemo } from "react";

import { createConfigurableComponent } from "@webiny/react-properties";

import { IconPackProvider as IconPack, ProviderIcon } from "./IconPackProvider";

import {
    icons as fa6RegularIconsJson,
    categories as fa6RegularCategoriesJson
} from "@iconify/json/json/fa6-regular.json";
import {
    icons as fa6SolidIconsJson,
    categories as fa6SolidCategoriesJson
} from "@iconify/json/json/fa6-solid.json";
import emojisJson from "unicode-emoji-json/data-by-emoji.json";

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

export const IconPickerConfig = Object.assign(base.Config, { IconPack });
export const IconPickerWithConfig = base.WithConfig;

export interface IconPackLoader {
    (): Promise<ProviderIcon[]>;
}

interface IconPickerConfig {
    iconPackProviders: {
        name: string;
        load: IconPackLoader;
    }[];
}

export interface IconPackProviderInterface {
    name: string;
    getIcons(): Promise<ProviderIcon[]>;
}

class IconPackProvider implements IconPackProviderInterface {
    public readonly name: string;
    private readonly loader: IconPackLoader;

    constructor(name: string, loader: IconPackLoader) {
        this.name = name;
        this.loader = loader;
    }

    getIcons(): Promise<ProviderIcon[]> {
        return this.loader();
    }
}

export function useIconPickerConfig() {
    const config = base.useConfig();

    const iconPackProviders = config.iconPackProviders || [];

    return useMemo(
        () => ({
            iconPackProviders: iconPackProviders.map(
                provider => new IconPackProvider(provider.name, provider.load)
            )
        }),
        [config]
    );
}

export const DefaultIcons = () => {
    return (
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

            {/* Examples of custom icons/emojis providers and async provider */}
            {/* <IconPickerConfig.IconPack
                name="test_custom_emojis"
                provider={() => [{ type: "emoji", name: "testing_face", value: "😀" }]}
            />
            <IconPickerConfig.IconPack
                name="test_custom_icons"
                provider={() => [
                    {
                        type: "icon",
                        name: "testing_book",
                        value: '<path fill="currentColor" d="M272 288h-64c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16h192c8.836 0 16-7.164 16-16c0-44.2-35.8-80-80-80zm-32-32c35.35 0 64-28.65 64-64s-28.65-64-64-64c-35.34 0-64 28.65-64 64s28.7 64 64 64zm256 64h-16v96h16c8.836 0 16-7.164 16-16v-64c0-8.8-7.2-16-16-16zm0-256h-16v96h16c8.8 0 16-7.2 16-16V80c0-8.84-7.2-16-16-16zm0 128h-16v96h16c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16zM384 0H96C60.65 0 32 28.65 32 64v384c0 35.35 28.65 64 64 64h288c35.35 0 64-28.65 64-64V64c0-35.35-28.7-64-64-64zm16 448c0 8.836-7.164 16-16 16H96c-8.836 0-16-7.164-16-16V64c0-8.838 7.164-16 16-16h288c8.836 0 16 7.162 16 16v384z"/>'
                    }
                ]}
            />
            <IconPickerConfig.IconPack
                name="fa6_brands"
                provider={async () => {
                    const iconsData = await fetch(
                        "https://raw.githubusercontent.com/iconify/icon-sets/master/json/fa6-brands.json"
                    )
                        .then(res => res.json())
                        .catch(() => null);

                    if (!iconsData) {
                        return [];
                    }

                    const { icons, categories } = iconsData;

                    return Object.keys(icons).map(key => {
                        const icon = icons[key];
                        return {
                            type: "icon",
                            name: `brands_${key}`,
                            value: icon.body,
                            category: Object.keys(categories).find(categoryKey =>
                                categories[categoryKey].includes(key)
                            ),
                            width: icon.width
                        };
                    });
                }}
            /> */}
        </IconPickerConfig>
    );
};
