import React, { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import { useWcpProjectLicense } from "./WcpProjectLicenseContext.js";
import { LicenseDecoratedFeatureFlags } from "./LicenseDecoratedFeatureFlags.js";

class FeatureFlagsStore {
    dto: IFeatureFlagsDto = {};
    ready = false;

    constructor() {
        makeAutoObservable(this);
    }

    set(dto: IFeatureFlagsDto) {
        this.dto = dto;
        this.ready = true;
    }
}

const store = new FeatureFlagsStore();

export function setProjectFeatureFlags(dto: IFeatureFlagsDto) {
    store.set(dto);
}

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export const FeatureFlagsProvider = observer(({ children }: { children: React.ReactNode }) => {
    const license = useWcpProjectLicense();
    const flags = license.hasLicense
        ? new LicenseDecoratedFeatureFlags(store.dto, license)
        : new FeatureFlags(store.dto);

    return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
});

export const FeatureFlagsGate = observer(
    ({ children, skip }: { children: React.ReactNode; skip?: boolean }) => {
        if (!store.ready && !skip) {
            return null;
        }

        return <>{children}</>;
    }
);

export function useProjectFeatureFlags(): FeatureFlags {
    const context = useContext(FeatureFlagsContext);
    if (!context) {
        throw new Error("useProjectFeatureFlags must be used within a FeatureFlagsProvider");
    }
    return context;
}
