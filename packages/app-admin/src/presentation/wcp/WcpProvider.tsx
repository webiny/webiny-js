import { autorun } from "mobx";
import React, { useEffect, useState } from "react";
import { useFeature } from "@webiny/app";
import { WcpFeature } from "~/features/wcp/feature.js";

interface WcpProviderProps {
    loader?: React.ReactElement;
    children: React.ReactNode;
}

export const WcpProvider = ({ children, loader }: WcpProviderProps) => {
    const { service } = useFeature(WcpFeature);

    const [isLoaded, setIsLoaded] = useState(service.isLoaded());

    useEffect(() => {
        return autorun(() => {
            setIsLoaded(service.isLoaded());
        });
    }, []);

    // Show loader while loading
    if (!isLoaded) {
        return loader || null;
    }

    return <>{children}</>;
};
