import React, { createContext, useContext } from "react";

export interface EnvContextValue {
    env: string;
    variant?: string;
    region?: string;
}

export interface EnvProviderProps extends Partial<EnvContextValue> {
    children: React.ReactNode;
}

const EnvContext = createContext<EnvContextValue | null>(null);

/*
 * Takes the environment explicitly. It used to read it back out of `WBY_PROJECT_SDK_CONTEXT`, which
 * was the only way to get it across to the child process the config was rendered in. The render
 * happens in the caller's process now, so the values are simply passed down.
 */
export const EnvProvider = ({ children, env, variant, region }: EnvProviderProps) => {
    const value: EnvContextValue = {
        env: env || "dev",
        variant,
        region
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
