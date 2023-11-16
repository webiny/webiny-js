import React, { useCallback } from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface IconProps {
    type: string;
    name: string;
    skinToneSupport?: boolean;
    category?: string;
    value: string;
    width?: number;
}

export type IconPackProviderProps = {
    name: string;
    provider: () => Promise<IconProps[]> | IconProps[];
};

export const IconPackProvider = ({ name, provider }: IconPackProviderProps) => {
    const getId = useIdGenerator("iconPackProvider");

    const load = useCallback(async () => {
        // Timeout for test purpose.
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await provider();
    }, [provider]);

    return (
        <Property id={getId(name)} name={"iconPackProviders"} array={true} value={load}></Property>
    );
};
