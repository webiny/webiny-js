import React from "react";

import { Property, useIdGenerator } from "@webiny/react-properties";

type Icon = {
    type: "icon";
    name: string;
    value: string;
    category?: string;
    width?: number;
};

export type Emoji = {
    type: "emoji";
    name: string;
    value: string;
    category: string;
    skinToneSupport: boolean;
};

type Custom = {
    type: "custom";
    name: string;
    value: string;
};

export type ProviderIcon = Icon | Emoji | Custom;

export type IconPackProviderProps = {
    name: string;
    provider: () => Promise<ProviderIcon[]> | ProviderIcon[];
};

export const IconPackProvider = ({ name, provider }: IconPackProviderProps) => {
    const getId = useIdGenerator("iconPackProvider");

    return (
        <Property id={getId(name)} name={"iconPackProviders"} array={true}>
            <Property id={getId(name, "name")} name={"name"} value={name} />
            <Property id={getId(name, "load")} name={"load"} value={provider} />
        </Property>
    );
};
