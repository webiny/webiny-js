import React, { createContext, useContext, useState, useCallback } from "react";
import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import { useWcpProjectLicense } from "./WcpProjectLicenseContext.js";
import { LicenseDecoratedFeatureFlags } from "./LicenseDecoratedFeatureFlags.js";

type NotifyFn = () => void;
let notifyFlagsReady: NotifyFn | null = null;
let featureFlagsDto: IFeatureFlagsDto = {};
let flagsReady = false;

export function setProjectFeatureFlags(dto: IFeatureFlagsDto) {
    featureFlagsDto = dto;
    flagsReady = true;
    if (notifyFlagsReady) {
        notifyFlagsReady();
    }
}

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const license = useWcpProjectLicense();
    const flags = license.hasLicense
        ? new LicenseDecoratedFeatureFlags(featureFlagsDto, license)
        : new FeatureFlags(featureFlagsDto);

    return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
};

export const FeatureFlagsGate: React.FC<{ children: React.ReactNode; skip?: boolean }> = ({
    children,
    skip
}) => {
    const [ready, setReady] = useState(flagsReady || skip);

    const notify = useCallback(() => setReady(true), []);
    notifyFlagsReady = notify;

    if (!ready) {
        return null;
    }

    return <>{children}</>;
};

export function useProjectFeatureFlags(): FeatureFlags {
    const context = useContext(FeatureFlagsContext);
    if (!context) {
        throw new Error("useProjectFeatureFlags must be used within a FeatureFlagsProvider");
    }
    return context;
}
