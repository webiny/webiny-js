import * as React from "react";
import { useEffect, useState } from "react";
import { Compose, HigherOrderComponent, makeComposable } from "@webiny/react-composition";
import { Property, Properties } from "~/index";

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

export interface ViewProps {
    onProperties?(properties: Property[]): void;
}

export function createConfigurableView(name: string) {
    /**
     * This component is used when we want to mount all composed configs.
     */
    const ConfigApply = makeComposable(`${name}ConfigApply`, ({ children }) => {
        return <>{children}</>;
    });

    /**
     * This component is used to configure the view (it can be mounted many times).
     */
    const Config: React.FC = ({ children }) => {
        return <Compose component={ConfigApply} with={createHOC(children)} />;
    };

    const Renderer = makeComposable(`${name}Renderer`, () => {
        return <div>{name}Renderer is not implemented!</div>;
    });

    interface ViewContext {
        properties: Property[];
    }

    const defaultContext = { properties: [] };

    const ViewContext = React.createContext<ViewContext>(defaultContext);

    const View: React.FC<ViewProps> = ({ onProperties }) => {
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
