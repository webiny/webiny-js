import React, { useEffect } from "react";
import { HigherOrderComponent, useApp } from "~/index";

export interface ProviderProps {
    hoc: HigherOrderComponent;
}

/**
 * Register a new React context provider.
 */
export const Provider: React.FC<ProviderProps> = ({ hoc }) => {
    const { addProvider } = useApp();

    useEffect(() => {
        return addProvider(hoc);
    }, []);

    return null;
};
