import React, { createContext, useContext } from "react";

export interface WcpProjectLicenseContextValue {
    hasLicense: boolean;
}

const WcpProjectLicenseContext = createContext<WcpProjectLicenseContextValue | null>(null);

export const WcpProjectLicenseProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const hasLicense = !!process.env.WCP_PROJECT_LICENSE;

    const value: WcpProjectLicenseContextValue = {
        hasLicense
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
