import React, { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { IconPackProvider as IconPack } from "./IconPackProvider";
import { IconType } from "./IconType";
import { SimpleIconPlugin } from "../plugins/iconsPlugin";
import { EmojiPlugin } from "../plugins/emojisPlugin";
import { CustomIconPlugin } from "../plugins/customPlugin";
import type { Icon } from "../types";
import { createProvider } from "@webiny/app";
import { Emojis } from "./Emojis";
import { FontAwesomeIcons } from "./FontAwesomeIcons";

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
            <SimpleIconPlugin />
            <EmojiPlugin />
            <CustomIconPlugin />
            <Emojis />
            <FontAwesomeIcons />
        </>
    );
};
