import React, { createContext, useContext, useMemo } from "react";
import { License } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";

export interface WcpProjectLicenseContextValue {
    hasLicense: boolean;
    canUseMultiTenancy: () => boolean;
    canUseTeams: () => boolean;
    canUsePrivateFiles: () => boolean;
    canUseFileManagerThreatDetection: () => boolean;
    canUseWorkflows: () => boolean;
}

const WcpProjectLicenseContext = createContext<WcpProjectLicenseContextValue | null>(null);

export const WcpProjectLicenseProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const license = useMemo(() => {
        const licenseEnv = process.env.WCP_PROJECT_LICENSE;
        if (!licenseEnv) {
            return null;
        }

        try {
            const licenseDto = JSON.parse(licenseEnv) as DecryptedWcpProjectLicense;
            return License.fromLicenseDto(licenseDto);
        } catch (e) {
            console.warn("Failed to parse WCP_PROJECT_LICENSE:", e);
            return null;
        }
    }, []);

    const hasLicense = !!license;

    const value: WcpProjectLicenseContextValue = {
        hasLicense,
        canUseMultiTenancy: () => hasLicense,
        canUseTeams: () => license?.canUseTeams() ?? false,
        canUsePrivateFiles: () => license?.canUsePrivateFiles() ?? false,
        canUseFileManagerThreatDetection: () => license?.canUseFileManagerThreatDetection() ?? false,
        canUseWorkflows: () => license?.canUseWorkflows() ?? false
    };

    return (
        <WcpProjectLicenseContext.Provider value={value}>
            {children}
        </WcpProjectLicenseContext.Provider>
    );
};

export const useWcpProjectLicense = () => {
    const context = useContext(WcpProjectLicenseContext);
    if (!context) {
        throw new Error("useWcpProjectLicense must be used within a WcpProjectLicenseProvider");
    }
    return context;
};
