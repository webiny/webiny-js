import React from "react";
import { useEnv, useVariant, useRegion, useEnvContext } from "~/services/GetProjectConfigService/EnvContext.js";

export interface EnvIsProps {
    env?: string | string[];
    variant?: string | string[];
    region?: string | string[];
    children: React.ReactNode;
}

/**
 * Helper function to check if a value matches any of the allowed values
 */
const matchesValue = (current: string | undefined, allowed: string | string[]): boolean => {
    if (!current) {
        return false;
    }
    const allowedArray = Array.isArray(allowed) ? allowed : [allowed];
    return allowedArray.includes(current);
};

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
    if (variant !== undefined && !matchesValue(currentVariant, variant)) {
        return null;
    }

    // Check if region matches
    if (region !== undefined && !matchesValue(currentRegion, region)) {
        return null;
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