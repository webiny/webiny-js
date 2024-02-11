import React, { createContext, useContext, useMemo } from "react";
import { BaseFunction } from "./Compose";
import { useComponent } from "./Context";

const ComposableContext = createContext<string[]>([]);
ComposableContext.displayName = "ComposableContext";

function useComposableParents() {
    const context = useContext(ComposableContext);
    if (!context) {
        return [];
    }

    return context;
}

const nullRenderer = () => null;

export type DecoratableComponent<T = (props: any) => React.ReactNode> = T & {
    displayName?: string;
    original: T;
    originalName: string;
};

function makeDecoratableComponent<T extends BaseFunction>(
    name: string,
    Component: T = nullRenderer as T
) {
    const Decoratable = (props: Parameters<T>[0]) => {
        const parents = useComposableParents();
        const ComposedComponent = useComponent(Component);

        const context = useMemo(() => [...parents, name], [parents, name]);

        return (
            <ComposableContext.Provider value={context}>
                <ComposedComponent {...props}>{props.children}</ComposedComponent>
            </ComposableContext.Provider>
        );
    };

    Decoratable.original = Component;
    Decoratable.originalName = name;
    Decoratable.displayName = `Decoratable<${name}>`;

    return Decoratable as DecoratableComponent<T>;
}

function makeDecoratableHook<T extends BaseFunction>(hook: T) {
    const decoratableHook = (params: Parameters<T>) => {
        const composedHook = useComponent(hook);

        return composedHook(params) as DecoratableHook<T>;
    };

    decoratableHook.original = hook;

    return decoratableHook as DecoratableHook<T>;
}

export type DecoratableHook<T> = T & {
    original: T;
};

export function makeDecoratable<T extends BaseFunction>(hook: T): DecoratableHook<T>;
export function makeDecoratable<T extends BaseFunction>(
    name: string,
    Component: T
): DecoratableComponent<T>;
export function makeDecoratable(hookOrName: any, Component?: any) {
    if (!Component) {
        return makeDecoratableHook(hookOrName);
    }

    return makeDecoratableComponent(hookOrName, Component);
}
