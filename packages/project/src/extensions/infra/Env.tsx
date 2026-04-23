import React from "react";
import {
    useEnv,
    useVariant,
    useRegion,
    useEnvContext
} from "~/services/GetProjectConfigService/EnvContext.js";
import { useProductionEnvironments } from "~/services/GetProjectConfigService/ProductionEnvironmentsContext.js";

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
    if (env !== undefined && !matchesValue(currentEnv, env)) {
        return null;
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
 * Conditionally renders children when the current environment, variant, or region does NOT match.
 * Multiple conditions are AND-ed together (renders when NONE of the conditions match).
 */
export const EnvIsNot: React.FC<EnvIsProps> = ({ env, variant, region, children }) => {
    const currentEnv = useEnv();
    const currentVariant = useVariant();
    const currentRegion = useRegion();

    // Check if env does NOT match
    if (env !== undefined && matchesValue(currentEnv, env)) {
        return null;
    }

    // Check if variant does NOT match
    if (variant !== undefined && matchesValue(currentVariant, variant)) {
        return null;
    }

    // Check if region does NOT match
    if (region !== undefined && matchesValue(currentRegion, region)) {
        return null;
    }

    return <>{children}</>;
};

export const EnvIsProd: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const env = useEnv();
    const prodEnvs = useProductionEnvironments();
    if (!prodEnvs.includes(env)) return null;
    return <>{children}</>;
};

export const EnvIsNotProd: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const env = useEnv();
    const prodEnvs = useProductionEnvironments();
    if (prodEnvs.includes(env)) return null;
    return <>{children}</>;
};

// Export hooks for direct use
export { useEnv, useVariant, useRegion, useEnvContext };
