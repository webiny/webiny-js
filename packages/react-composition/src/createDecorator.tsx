import React from "react";
import { CanReturnNull, Compose, Decoratable, Decorator } from "./index";
import { DecoratableComponent, DecoratableHook } from "~/types";

type GetBaseFunction<T> = T extends DecoratableComponent<infer F> ? F : never;

/**
 * Creates a component which, when mounted, registers a Higher Order Component for the given base component.
 * This is particularly useful for decorating (wrapping) existing composable components.
 * For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.
 */
export function createComponentPlugin<T extends Decoratable>(
    Base: T,
    hoc: Decorator<CanReturnNull<GetBaseFunction<T>>>
) {
    return createDecorator(Base, hoc);
}

export type GetDecorateeParams<T> = T extends (params: infer P) => any ? P : never;

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
    hoc: Decorator<CanReturnNull<GetDecoratee<T>>>
) {
    const DecoratorPlugin = () => <Compose component={Base} with={hoc as any} />;
    if (isDecoratableComponent(Base)) {
        DecoratorPlugin.displayName = Base.displayName;
    }
    return DecoratorPlugin;
}
