import * as React from "react";
import { Compose, HigherOrderComponent, makeComposable } from "@webiny/react-composition";

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

export function createConfigPortal(name: string) {
    /**
     * This component is used when we want to mount all composed configs.
     */
    const ConfigApply = makeComposable(`${name}ConfigApply`, ({ children }) => {
        return <>{children}</>;
    });

    /**
     * This component is used to configure the view (it can be mounted many times, and it will accumulate all configs).
     * These configs are not executed until they're actually mounted using the `ConfigApply` component.
     */
    const Config: React.FC = ({ children }) => {
        return <Compose component={ConfigApply} with={createHOC(children)} />;
    };

    return {
        ConfigApply,
        Config
    };
}
