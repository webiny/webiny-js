import { autorun } from "mobx";
import React, { useEffect, useState } from "react";
import { useFeature } from "@webiny/app";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { DevToolsSection } from "~/components/index.js";

interface FeatureFlagsProviderProps {
    loader?: React.ReactElement;
    children: React.ReactNode;
}

export const FeatureFlagsProvider = ({ children, loader }: FeatureFlagsProviderProps) => {
    const { service } = useFeature(FeatureFlagsFeature);

    const [isLoaded, setIsLoaded] = useState(service.isLoaded());

    useEffect(() => {
        return autorun(() => {
            setIsLoaded(service.isLoaded());
        });
    }, []);

    if (!isLoaded) {
        return loader || null;
    }

    return (
        <>
            <DevToolsSection
                name={"Feature Flags"}
                group={"Project"}
                data={service.getFlags().toDto()}
                views={"raw"}
            />
            {children}
        </>
    );
};
