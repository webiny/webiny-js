import React from "react";
import { GenericDecorator } from "~/Context";

export type GenericHook = (...args: any) => any;

export type GenericComponent<T = any> = React.FunctionComponent<T>;

export type ComposedFunction = GenericHook;

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
    | GenericDecorator<GenericComponent>
    | GenericDecorator<GenericComponent>[]
    | GenericDecorator<GenericHook>
    | GenericDecorator<GenericHook>[];

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
