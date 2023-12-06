import { useEffect } from "react";
import { HigherOrderComponent, useApp } from "~/index";

export interface ProviderProps {
    hoc: HigherOrderComponent;
}

/**
 * Register a new React context provider.
 */
export const Provider = ({ hoc }: ProviderProps) => {
    const { addProvider } = useApp();

    useEffect(() => {
        return addProvider(hoc);
    }, []);

    return null;
};
