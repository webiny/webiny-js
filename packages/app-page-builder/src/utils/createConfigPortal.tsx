import * as React from "react";
import { Compose, GenericComponent, Decorator, makeDecoratable } from "@webiny/react-composition";

const createHOC =
    (newChildren: React.ReactNode): Decorator<GenericComponent> =>
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

export interface ConfigProps {
    children?: React.ReactNode;
}

export function createConfigPortal(name: string) {
    /**
     * This component is used when we want to mount all composed configs.
     */
    const ConfigApply = makeDecoratable(`${name}ConfigApply`, ({ children }) => {
        return <>{children}</>;
    });

    /**
     * This component is used to configure the view (it can be mounted many times, and it will accumulate all configs).
     * These configs are not executed until they're actually mounted using the `ConfigApply` component.
     */
    const Config: React.ComponentType<ConfigProps> = ({ children }) => {
        return <Compose component={ConfigApply} with={createHOC(children)} />;
    };

    return {
        ConfigApply,
        Config
    };
}
