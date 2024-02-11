import React from "react";

export type GenericHook = (...args: any) => any;

export type GenericComponent<T = any> = React.FunctionComponent<T>;

export type ComposedFunction = GenericHook;

export type Decorator<T> = (decoratee: T) => T;

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

export type DecoratableComponent<T extends GenericComponent = GenericComponent> = T & {
    displayName?: string;
    original: T;
    originalName: string;
};

export type Decoratable = DecoratableComponent | DecoratableHook;
