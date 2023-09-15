import React, { useCallback, useState, useRef, useEffect } from "react";
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

    const isMounted = useRef(true);
    const [icons, setIcons] = useState<IconProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const initialize = useCallback(async () => {
        setIsLoading(true);

        const iconsData = await provider();

        if (!isMounted.current) {
            return;
        }

        setIcons(iconsData);
        setIsInitialized(true);
        setIsLoading(false);
    }, [provider]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return (
        <Property id={getId(name)} name={"iconPackProviders"} array={true}>
            <Property id={getId(name, "initialize")} name={"initialize"} value={initialize} />
            {isLoading && (
                <Property id={getId(name, "isLoading")} name={"isLoading"} value={isLoading} />
            )}
            {isInitialized && (
                <Property
                    id={getId(name, "isInitialized")}
                    name={"isInitialized"}
                    value={isInitialized}
                />
            )}
            {Boolean(icons.length) && (
                <Property id={getId(name, "icons")} name={"icons"} value={icons} />
            )}
        </Property>
    );
};
