import React from "react";
import { useEnv, useVariant, useRegion, useEnvContext } from "~/services/GetProjectConfigService/EnvContext.js";

export interface EnvIsProps {
    env?: string | string[];
    variant?: string | string[];
    region?: string | string[];
    children: React.ReactNode;
}

/**
 * Conditionally renders children based on the current environment, variant, or region.
 * Multiple conditions are AND-ed together.
 */
export const EnvIs: React.FC<EnvIsProps> = ({ env, variant, region, children }) => {
    const currentEnv = useEnv();
    const currentVariant = useVariant();
    const currentRegion = useRegion();

    // Check if env matches
    if (env !== undefined) {
        const envArray = Array.isArray(env) ? env : [env];
        if (!envArray.includes(currentEnv)) {
            return null;
        }
    }

    // Check if variant matches
    if (variant !== undefined) {
        const variantArray = Array.isArray(variant) ? variant : [variant];
        if (!currentVariant || !variantArray.includes(currentVariant)) {
            return null;
        }
    }

    // Check if region matches
    if (region !== undefined) {
        const regionArray = Array.isArray(region) ? region : [region];
        if (!currentRegion || !regionArray.includes(currentRegion)) {
            return null;
        }
    }

    return <>{children}</>;
};

/**
 * Hook to check if the current environment is a production environment.
 * By default, "prod" and "production" are considered production environments.
 * This can be customized via the ProductionEnvironments extension.
 */
export const useIsProduction = () => {
    const currentEnv = useEnv();
    // Default production environments
    const defaultProductionEnvs = ["prod", "production"];
    return defaultProductionEnvs.includes(currentEnv);
};

/**
 * Conditionally renders children if the current environment is a production environment.
 */
export const EnvIsProduction: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isProduction = useIsProduction();
    return isProduction ? <>{children}</> : null;
};

// Export hooks for direct use
export { useEnv, useVariant, useRegion, useEnvContext };
