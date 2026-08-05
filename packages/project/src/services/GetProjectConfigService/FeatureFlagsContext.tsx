import React, { createContext, useContext } from "react";
import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import { useWcpProjectLicense } from "./WcpProjectLicenseContext.js";
import { LicenseDecoratedFeatureFlags } from "./LicenseDecoratedFeatureFlags.js";

let featureFlagsDto: IFeatureFlagsDto = {};

export function setProjectFeatureFlags(dto: IFeatureFlagsDto) {
    featureFlagsDto = dto;
}

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const license = useWcpProjectLicense();
    const flags = license.hasLicense
        ? new LicenseDecoratedFeatureFlags(featureFlagsDto, license)
        : new FeatureFlags(featureFlagsDto);

    return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
};

export function useProjectFeatureFlags(): FeatureFlags {
    const context = useContext(FeatureFlagsContext);
    if (!context) {
        throw new Error("useProjectFeatureFlags must be used within a FeatureFlagsProvider");
    }
    return context;
}
