import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface WcpFeatureOverridesContextValue {
    overrides: Record<string, boolean>;
    setOverride: (name: string, enabled: boolean) => void;
}

const WcpFeatureOverridesContext = createContext<WcpFeatureOverridesContextValue>({
    overrides: {},
    setOverride: () => {}
});

export const WcpFeatureOverridesProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    const setOverride = useCallback((name: string, enabled: boolean) => {
        setOverrides(prev => ({ ...prev, [name]: enabled }));
    }, []);

    const value = useMemo(() => ({ overrides, setOverride }), [overrides, setOverride]);

    return (
        <WcpFeatureOverridesContext.Provider value={value}>
            {children}
        </WcpFeatureOverridesContext.Provider>
    );
};

export const useWcpFeatureOverrides = () => useContext(WcpFeatureOverridesContext);
