import React, { createContext, useContext, useMemo } from "react";
import { useComponent } from "./Context";
import {
    CanReturnNull,
    DecoratableComponent,
    DecoratableHook,
    GenericComponent,
    GenericHook
} from "~/types";

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

function makeDecoratableComponent<T extends GenericComponent>(
    name: string,
    Component: T = nullRenderer as unknown as T
) {
    const Decoratable = (props: Parameters<T>[0]): JSX.Element | null => {
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

    return Decoratable;
}

function makeDecoratableHook<T extends GenericHook>(hook: T) {
    const decoratableHook = (params: Parameters<T>) => {
        const composedHook = useComponent(hook);

        return composedHook(params) as DecoratableHook<T>;
    };

    decoratableHook.original = hook;

    return decoratableHook as DecoratableHook<T>;
}

export function createVoidComponent<T>() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (props: T): JSX.Element | null => {
        return null;
    };
}

export function makeDecoratable<T extends GenericHook>(hook: T): DecoratableHook<T>;
export function makeDecoratable<T extends GenericComponent>(
    name: string,
    Component: T
): DecoratableComponent<CanReturnNull<T>>;
export function makeDecoratable(hookOrName: any, Component?: any) {
    if (!Component) {
        return makeDecoratableHook(hookOrName);
    }

    return makeDecoratableComponent(hookOrName, Component);
}
