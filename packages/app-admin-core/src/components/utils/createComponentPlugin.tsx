import React, { ComponentProps } from "react";
import { ComposableFC, Compose, HigherOrderComponent } from "@webiny/react-composition";

export function createComponentPlugin<T extends ComposableFC<ComponentProps<T>>>(
    Base: T,
    hoc: HigherOrderComponent<ComponentProps<T>>
): React.FC {
    const ComponentPlugin = () => <Compose component={Base} with={hoc} />;
    ComponentPlugin.displayName = Base.displayName;
    return ComponentPlugin;
}
