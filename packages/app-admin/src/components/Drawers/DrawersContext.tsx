import type { ReactNode } from "react";
import React, { useCallback, useState } from "react";
import { createProvider } from "@webiny/app";
import { DrawerParamsContext } from "./DrawerParamsContext.js";
import { useAdminConfig } from "~/config/AdminConfig.js";

interface OpenDrawerEntry {
    name: string;
    params: Record<string, unknown>;
}

export interface DrawersContext {
    openNamedDrawer: (name: string, params?: Record<string, unknown>) => void;
    closeNamedDrawer: (name?: string) => void;
}

interface DrawersProviderProps {
    children: ReactNode;
}

export const DrawersContext = React.createContext<DrawersContext | undefined>(undefined);

export const DrawersProvider = ({ children }: DrawersProviderProps) => {
    const [stack, setStack] = useState<OpenDrawerEntry[]>([]);
    const { drawers: registeredDrawers } = useAdminConfig();

    const openNamedDrawer = useCallback((name: string, params: Record<string, unknown> = {}) => {
        setStack(prev => {
            if (prev.some(entry => entry.name === name)) {
                return prev;
            }
            return [...prev, { name, params }];
        });
    }, []);

    const closeNamedDrawer = useCallback((name?: string) => {
        setStack(prev => {
            if (!name) {
                return prev.slice(0, -1);
            }
            return prev.filter(entry => entry.name !== name);
        });
    }, []);

    const context: DrawersContext = {
        openNamedDrawer,
        closeNamedDrawer
    };

    return (
        <DrawersContext.Provider value={context}>
            {children}
            {stack.map(entry => {
                const registration = registeredDrawers.find(d => d.name === entry.name);
                if (!registration) {
                    return null;
                }
                return (
                    <DrawerParamsContext.Provider
                        key={entry.name}
                        value={{
                            params: entry.params,
                            closeDrawer: () => closeNamedDrawer(entry.name)
                        }}
                    >
                        {registration.element}
                    </DrawerParamsContext.Provider>
                );
            })}
        </DrawersContext.Provider>
    );
};

export const createDrawersProvider = () => {
    return createProvider(Component => {
        return function DrawersProviderHOC({ children }: DrawersProviderProps) {
            return (
                <DrawersProvider>
                    <Component>{children}</Component>
                </DrawersProvider>
            );
        };
    });
};
