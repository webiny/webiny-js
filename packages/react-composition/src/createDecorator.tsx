import React from "react";
import {
    CanReturnNullOrElement,
    Decoratable,
    DecoratableComponent,
    DecoratableHook,
    Decorator
} from "~/types";
import { Compose } from "~/Compose";

type GetBaseFunction<T> = T extends DecoratableComponent<infer F> ? F : never;

/**
 * Creates a component which, when mounted, registers a Higher Order Component for the given base component.
 * This is particularly useful for decorating (wrapping) existing composable components.
 * For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.
 */
export function createComponentPlugin<T extends Decoratable>(
    Base: T,
    hoc: T extends DecoratableComponent
        ? Decorator<CanReturnNullOrElement<GetBaseFunction<T>>>
        : Decorator<GetBaseFunction<T>>
) {
    return createDecorator(Base, hoc);
}

// Maybe there's a better way to mark params as non-existent, but for now I left it as `any`.
// TODO: revisit this type; not sure if `?` can be handled in one clause
export type GetDecorateeParams<T> = T extends (params?: infer P1) => any
    ? P1
    : T extends (params: infer P2) => any
    ? P2
    : any;

export type GetDecoratee<T> = T extends DecoratableHook<infer F>
    ? F
    : T extends DecoratableComponent<infer F>
    ? F
    : never;

const isDecoratableComponent = (
    decoratable: DecoratableComponent | DecoratableHook
): decoratable is DecoratableComponent => {
    return "displayName" in decoratable;
};

export function createDecorator<T extends Decoratable>(
    Base: T,
    hoc: T extends DecoratableComponent
        ? Decorator<CanReturnNullOrElement<GetBaseFunction<T>>>
        : Decorator<GetBaseFunction<T>>
) {
    const DecoratorPlugin = () => <Compose component={Base} with={hoc as any} />;
    if (isDecoratableComponent(Base)) {
        DecoratorPlugin.displayName = Base.displayName;
    }
    return DecoratorPlugin;
}
