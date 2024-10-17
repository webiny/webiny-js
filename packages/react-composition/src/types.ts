import React from "react";

export type GenericHook<TParams = any, TReturn = any> = (...args: TParams[]) => TReturn;

export type GenericComponent<T = any> = React.FunctionComponent<T>;

export type ComposedFunction = GenericHook;

export type Decorator<T> = (decoratee: T) => T;

/**
 * Some decoratable components will always return `null`, by design.
 * To allow you to decorate these components, we must tell TS that the decorator is allowed to return not just `null`
 * (which is inferred from the component type), but also a JSX.Element.
 */
export type ComponentDecorator<T> = (decoratee: T) => CanReturnNullOrElement<T>;

/**
 * @deprecated
 */
export type ComposableFC<T> = T & {
    displayName?: string;
    original: T;
    originalName: string;
};

export type Enumerable<T> = T extends Array<infer D> ? Array<D> : never;

export type ComposeWith =
    | Decorator<GenericComponent>
    | Decorator<GenericComponent>[]
    | Decorator<GenericHook>
    | Decorator<GenericHook>[];

export type DecoratableHook<T extends GenericHook = GenericHook> = T & {
    original: T;
    originalName: string;
};

export type DecoratableComponent<T = GenericComponent> = T & {
    original: T;
    originalName: string;
    displayName: string;
};

export type Decoratable = DecoratableComponent | DecoratableHook;

/**
 * @internal Add `null` to the ReturnType of the given function.
 */
export type CanReturnNullOrElement<T> = T extends (...args: any) => any
    ? (...args: Parameters<T>) => JSX.Element | null
    : never;
