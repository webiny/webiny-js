import React, { ComponentProps } from "react";
import { ComposableFC, Compose, HigherOrderComponent } from "./index";

/**
 * Creates a component which, when mounted, registers a Higher Order Component for the given base component.
 * This is particularly useful for decorating (wrapping) existing composable components.
 * For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.
 */
export function createComponentPlugin<T extends ComposableFC<ComponentProps<T>>>(
    Base: T,
    hoc: HigherOrderComponent<ComponentProps<T>>
) {
    const ComponentPlugin = () => <Compose component={Base} with={hoc} />;
    ComponentPlugin.displayName = Base.displayName;
    return ComponentPlugin;
}
