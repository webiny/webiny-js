import React, { useContext, useEffect, useMemo, useState } from "react";
import { Compose, Decorator, makeDecoratable } from "@webiny/react-composition";
import { Property, Properties, toObject } from "~/index";
import { GenericComponent } from "@webiny/react-composition/types";

const createHOC =
    (newChildren: React.ReactNode): Decorator<GenericComponent<{ children?: React.ReactNode }>> =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
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
    /**
     * This component is used when we want to mount all composed configs.
     */
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

    /**
     * This component is used to configure the component (it can be mounted many times).
     */
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

    const WithConfig = ({ onProperties, children }: WithConfigProps) => {
        const [properties, setProperties] = useState<Property[]>([]);
        const context = { properties };

        useEffect(() => {
            if (typeof onProperties === "function") {
                onProperties(properties);
            }
        }, [properties]);

        const stateUpdater = (properties: Property[]) => {
            setProperties(properties);
        };

        return (
            <ViewContext.Provider value={context}>
                <Properties onChange={stateUpdater}>
                    <ConfigApplyPrimary />
                    <ConfigApplySecondary />
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
