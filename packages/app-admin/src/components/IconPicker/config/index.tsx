import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { IconPackProvider as IconPack } from "./IconPackProvider.js";
import { IconType } from "./IconType.js";
import { SimpleIconPlugin } from "../plugins/iconsPlugin.js";
import { EmojiPlugin } from "../plugins/emojisPlugin.js";
import { CustomIconPlugin } from "../plugins/customPlugin.js";
import type { Icon } from "../types.js";
import { createProvider } from "@webiny/app";
import { RegisterFeature } from "~/components/RegisterFeature.js";
import { ListCustomIconsFeature } from "~/features/listCustomIcons/index.js";
import { Emojis } from "./Emojis.js";
import { FontAwesomeIcons } from "./FontAwesomeIcons.js";

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

export type { IconTypeInterface as IconType };

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
            <RegisterFeature feature={ListCustomIconsFeature} />
            <SimpleIconPlugin />
            <EmojiPlugin />
            <CustomIconPlugin />
            <Emojis />
            <FontAwesomeIcons />
        </>
    );
};
