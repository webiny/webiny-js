import React, { useContext, useEffect, useMemo, useState } from "react";
import type { Decorator } from "@webiny/react-composition";
import { Compose, makeDecoratable } from "@webiny/react-composition";
import type { GenericComponent } from "@webiny/react-composition/types.js";
import type { Property } from "@webiny/react-properties";
import { Properties, toObject, useDebugConfig } from "@webiny/react-properties";

const createHOC = (
    newChildren: React.ReactNode
): Decorator<GenericComponent<{ children?: React.ReactNode }>> => {
    return BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
                </BaseComponent>
            );
        };
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
}

const name = "AdminConfig";

export function createAdminConfig<TConfig>() {
    /**
     * This component is used when we want to mount all composed configs.
     */
    const ApplyPublicConfig = makeDecoratable(
        `${name}Apply<Public>`,
        ({ children }: ConfigApplyProps) => {
            return <>{children}</>;
        }
    );

    const ApplyProtectedConfig = makeDecoratable(
        `${name}Apply<Protected>`,
        ({ children }: ConfigApplyProps) => {
            return <>{children}</>;
        }
    );

    /**
     * This component is used to configure the component (it can be mounted many times).
     */
    const PublicConfig = ({ children }: ConfigProps) => {
        return <Compose component={ApplyPublicConfig} with={createHOC(children)} />;
    };

    const ProtectedConfig = ({ children }: ConfigProps) => {
        return <Compose component={ApplyProtectedConfig} with={createHOC(children)} />;
    };

    interface ViewContext {
        name: string;
        properties: Property[];
    }

    const defaultContext = { name, properties: [] };

    const ViewContext = React.createContext<ViewContext>(defaultContext);

    const WithConfig = ({ onProperties, children }: WithConfigProps) => {
        const [properties, setProperties] = useState<Property[]>([]);
        useDebugConfig(name, properties);
        const context = { name, properties };

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
                <Properties onChange={stateUpdater} name={name}>
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
        PrivateConfig: ProtectedConfig,
        PublicConfig,
        ApplyPublicConfig,
        ApplyProtectedConfig,
        useConfig
    };
}
