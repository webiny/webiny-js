import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { Icon } from "~/components/IconPicker/types";

export type IconPackProviderProps = {
    name: string;
    provider: () => Promise<Icon[]> | Icon[];
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
