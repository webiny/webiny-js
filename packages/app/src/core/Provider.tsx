import { useEffect } from "react";
import { GenericComponent, GenericDecorator, useApp } from "~/index";

export interface ProviderProps {
    hoc: GenericDecorator<GenericComponent>;
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
