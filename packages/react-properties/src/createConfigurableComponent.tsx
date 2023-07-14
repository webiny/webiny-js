import React, { useContext, useEffect, useMemo, useState } from "react";
import { Compose, HigherOrderComponent, makeComposable } from "@webiny/react-composition";
import { Property, Properties, toObject } from "~/index";

const createHOC =
    (newChildren: React.ReactNode): HigherOrderComponent =>
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

export function createConfigurableComponent<TConfig>(name: string) {
    /**
     * This component is used when we want to mount all composed configs.
     */
    const ConfigApply = makeComposable(`${name}ConfigApply`, ({ children }) => {
        return <>{children}</>;
    });

    /**
     * This component is used to configure the component (it can be mounted many times).
     */
    const Config = ({ children }: { children: React.ReactNode }) => {
        return <Compose component={ConfigApply} with={createHOC(children)} />;
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
                    <ConfigApply />
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
