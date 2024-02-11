import * as React from "react";
import { useEffect, useState } from "react";
import {
    Compose,
    GenericComponent,
    GenericDecorator,
    makeDecoratable
} from "@webiny/react-composition";
import { Property, Properties } from "~/index";

const createHOC =
    (newChildren: React.ReactNode): GenericDecorator<GenericComponent> =>
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

export interface ConfigPropss {
    children: React.ReactNode;
}

export interface ViewProps {
    onProperties?(properties: Property[]): void;
}

export function createConfigurableView(name: string) {
    /**
     * This component is used when we want to mount all composed configs.
     */
    const ConfigApply = makeDecoratable(`${name}ConfigApply`, ({ children }) => {
        return <>{children}</>;
    });

    /**
     * This component is used to configure the view (it can be mounted many times).
     */
    const Config = ({ children }: ConfigPropss) => {
        return <Compose component={ConfigApply} with={createHOC(children)} />;
    };

    const Renderer = makeDecoratable(`${name}Renderer`, () => {
        return <div>{name}Renderer is not implemented!</div>;
    });

    interface ViewContext {
        properties: Property[];
    }

    const defaultContext = { properties: [] };

    const ViewContext = React.createContext<ViewContext>(defaultContext);

    const View = ({ onProperties }: ViewProps) => {
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
                    <Renderer />
                </Properties>
            </ViewContext.Provider>
        );
    };

    return {
        View,
        Config
    };
}
