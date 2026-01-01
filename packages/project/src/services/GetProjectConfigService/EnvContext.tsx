import React, { createContext, useContext } from "react";
import { getProjectSdkContextFromEnv } from "~/utils/index.js";

export interface EnvContextValue {
    env: string;
    variant?: string;
    region?: string;
    productionEnvironments: string[];
}

const EnvContext = createContext<EnvContextValue | null>(null);

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const context = getProjectSdkContextFromEnv();
    
    const value: EnvContextValue = {
        env: context?.env || "dev",
        variant: context?.variant,
        region: context?.region,
        productionEnvironments: context?.productionEnvironments || ["prod", "production"]
    };

    return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
};

export const useEnv = () => {
    const context = useContext(EnvContext);
    if (!context) {
        throw new Error("useEnv must be used within an EnvProvider");
    }
    return context.env;
};

export const useVariant = () => {
    const context = useContext(EnvContext);
    if (!context) {
        throw new Error("useVariant must be used within an EnvProvider");
    }
    return context.variant;
};

export const useRegion = () => {
    const context = useContext(EnvContext);
    if (!context) {
        throw new Error("useRegion must be used within an EnvProvider");
    }
    return context.region;
};

export const useEnvContext = () => {
    const context = useContext(EnvContext);
    if (!context) {
        throw new Error("useEnvContext must be used within an EnvProvider");
    }
    return context;
};

export const useProductionEnvironments = () => {
    const context = useContext(EnvContext);
    if (!context) {
        throw new Error("useProductionEnvironments must be used within an EnvProvider");
    }
    return context.productionEnvironments;
};