import React from "react";
import {
    BaseFunction,
    ComposableFC,
    Compose,
    DecoratableComponent,
    DecoratableHook,
    Decorator
} from "./index";

type GetBaseFunction<T> = T extends ComposableFC<infer F> ? F : never;

/**
 * Creates a component which, when mounted, registers a Higher Order Component for the given base component.
 * This is particularly useful for decorating (wrapping) existing composable components.
 * For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.
 */
export function createComponentPlugin<T extends ComposableFC<BaseFunction>>(
    Base: T,
    hoc: Decorator<GetBaseFunction<T>>
) {
    const ComponentPlugin = () => <Compose component={Base} with={hoc as any} />;
    ComponentPlugin.displayName = Base.displayName;
    return ComponentPlugin;
}

export type GetDecorateeParams<T> = T extends (params: infer P) => any ? P : never;

export type GetDecoratee<T> = T extends DecoratableHook<infer F>
    ? F
    : T extends DecoratableComponent<infer F>
    ? F
    : never;

const isDecoratableComponent = (
    decoratable: DecoratableComponent<unknown> | DecoratableHook<unknown>
): decoratable is DecoratableComponent<unknown> => {
    return "displayName" in decoratable;
};

export function createDecorator<T extends DecoratableHook<unknown> | DecoratableComponent<unknown>>(
    Base: T,
    hoc: Decorator<GetDecoratee<T>>
) {
    const DecoratorPlugin = () => <Compose component={Base} with={hoc as any} />;
    if (isDecoratableComponent(Base)) {
        DecoratorPlugin.displayName = Base.displayName;
    }
    return DecoratorPlugin;
}
