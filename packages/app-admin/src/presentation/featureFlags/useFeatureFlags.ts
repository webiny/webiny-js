import { useState, useEffect } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { FeatureFlags } from "@webiny/feature-flags";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";

export function useFeatureFlags(): FeatureFlags {
    const { service } = useFeature(FeatureFlagsFeature);
    const [flags, setFlags] = useState<FeatureFlags>(() => service.getFlags());

    useEffect(() => {
        return autorun(() => {
            setFlags(service.getFlags());
        });
    }, [service]);

    return flags;
}
