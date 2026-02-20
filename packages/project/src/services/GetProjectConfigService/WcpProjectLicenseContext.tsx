import React, { createContext, useContext, useMemo } from "react";
import { License } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import {
    WcpFeatureOverridesProvider,
    useWcpFeatureOverrides
} from "../../components/WcpFeatureOverridesContext.js";

export interface WcpProjectLicenseContextValue {
    hasLicense: boolean;
    canUseMultiTenancy: () => boolean;
    canUseTeams: () => boolean;
    canUsePrivateFiles: () => boolean;
    canUseFileManagerThreatDetection: () => boolean;
    canUseWorkflows: () => boolean;
}

const WcpProjectLicenseContext = createContext<WcpProjectLicenseContextValue | null>(null);

const WcpProjectLicenseInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { overrides } = useWcpFeatureOverrides();

    const license = useMemo(() => {
        const licenseEnv = process.env.WCP_PROJECT_LICENSE;
        if (!licenseEnv) {
            return null;
        }

        try {
            const licenseDto = JSON.parse(licenseEnv) as DecryptedWcpProjectLicense;
            return License.fromLicenseDto(licenseDto);
        } catch (e) {
            console.warn(
                "Failed to parse WCP_PROJECT_LICENSE environment variable. Expected valid JSON with DecryptedWcpProjectLicense format:",
                e
            );
            return null;
        }
    }, []);

    const hasLicense = !!license;

    const isFeatureEnabled = (name: string, licenseAllows: boolean) => {
        if (name in overrides) {
            // User can only disable; cannot enable beyond what the license permits.
            return overrides[name] === false ? false : licenseAllows;
        }
        return licenseAllows;
    };

    const value: WcpProjectLicenseContextValue = {
        hasLicense,
        canUseMultiTenancy: () => isFeatureEnabled("multiTenancy", hasLicense),
        canUseTeams: () => isFeatureEnabled("teams", license?.canUseTeams() ?? false),
        canUsePrivateFiles: () =>
            isFeatureEnabled("privateFiles", license?.canUsePrivateFiles() ?? false),
        canUseFileManagerThreatDetection: () =>
            isFeatureEnabled(
                "fileManagerThreatDetection",
                license?.canUseFileManagerThreatDetection() ?? false
            ),
        canUseWorkflows: () =>
            isFeatureEnabled("workflows", license?.canUseWorkflows() ?? false)
    };

    return (
        <WcpProjectLicenseContext.Provider value={value}>
            {children}
        </WcpProjectLicenseContext.Provider>
    );
};

export const WcpProjectLicenseProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    return (
        <WcpFeatureOverridesProvider>
            <WcpProjectLicenseInner>{children}</WcpProjectLicenseInner>
        </WcpFeatureOverridesProvider>
    );
};

export const useWcpProjectLicense = () => {
    const context = useContext(WcpProjectLicenseContext);
    if (!context) {
        throw new Error("useWcpProjectLicense must be used within a WcpProjectLicenseProvider");
    }
    return context;
};
