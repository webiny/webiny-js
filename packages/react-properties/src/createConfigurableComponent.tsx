import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Decorator } from "@webiny/react-composition";
import { Compose, makeDecoratable } from "@webiny/react-composition";
import type { GenericComponent } from "@webiny/react-composition/types.js";
import type { Property } from "~/index.js";
import { Properties, toObject } from "~/index.js";
import { useDebugConfig } from "./useDebugConfig.js";
import { PropertyPriorityProvider } from "./PropertyPriority.js";

const createHOC =
    (newChildren: React.ReactNode): Decorator<GenericComponent<{ children?: React.ReactNode }>> =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {children}
                    {newChildren}
                </BaseComponent>
            );
        };
    };

export interface WithConfigProps {
    children: React.ReactNode;
    onProperties?(properties: Property[]): void;
}

interface ConfigApplyProps {
    children?: React.ReactNode;
}

export interface ConfigProps {
    children: React.ReactNode;
    priority?: "primary" | "secondary";
}

export function createConfigurableComponent<TConfig>(name: string) {
    const ConfigApplyPrimary = makeDecoratable(
        `${name}ConfigApply<Primary>`,
        ({ children }: ConfigApplyProps) => {
            return <>{children}</>;
        }
    );

    const ConfigApplySecondary = makeDecoratable(
        `${name}ConfigApply<Secondary>`,
        ({ children }: ConfigApplyProps) => {
            return <>{children}</>;
        }
    );

    const Config = ({ priority = "primary", children }: ConfigProps) => {
        if (priority === "primary") {
            return <Compose component={ConfigApplyPrimary} with={createHOC(children)} />;
        }
        return <Compose component={ConfigApplySecondary} with={createHOC(children)} />;
    };

    interface ViewContext {
        properties: Property[];
    }

    const defaultContext = { properties: [] };

    const ViewContext = React.createContext<ViewContext>(defaultContext);

    /**
     * Memoized config subtree — ConfigApply components don't depend on WithConfig
     * props, so they must not remount when the parent re-renders. Without this,
     * every parent re-render causes Property components inside HOCs to unmount
     * and remount, corrupting the config object.
     */
    const ConfigApplyTree = React.memo(function ConfigApplyTree() {
        console.log("ConfigApplyTree render");
        return (
            <>
                <ConfigApplyPrimary />
                <PropertyPriorityProvider priority={1}>
                    <ConfigApplySecondary />
                </PropertyPriorityProvider>
            </>
        );
    });

    const WithConfig = ({ onProperties, children }: WithConfigProps) => {
        const [properties, setProperties] = useState<Property[]>([]);
        useDebugConfig(name, properties);
        const context = { properties };

        useEffect(() => {
            if (typeof onProperties === "function") {
                onProperties(properties);
            }
        }, [properties]);

        const stateUpdater = useCallback((properties: Property[]) => {
            setProperties(properties);
        }, []);

        return (
            <ViewContext.Provider value={context}>
                <Properties onChange={stateUpdater}>
                    <ConfigApplyTree />
                    {children}
                </Properties>
            </ViewContext.Provider>
        );
    };

    function useConfig<TExtra extends object>(): TConfig & TExtra {
        const { properties } = useContext(ViewContext);
        return useMemo(() => toObject<TConfig & TExtra>(properties), [properties]);
    }

    return {
        WithConfig,
        Config,
        useConfig
    };
}
