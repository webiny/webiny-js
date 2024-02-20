import { useEffect } from "react";
import { GenericComponent, Decorator, useApp } from "~/index";

export interface ProviderProps {
    hoc: Decorator<GenericComponent>;
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
