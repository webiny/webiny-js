import React, { createContext, useContext, useMemo } from "react";
import { useComponent } from "./Context";
import { DecoratableComponent, DecoratableHook, GenericComponent, GenericHook } from "~/types";
import { withDecoratorFactory, withHookDecoratorFactory } from "~/decorators";

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

// Maybe there's a better way to mark props as non-existent, but for now I left it as `any`.
type NoProps = any;

type GetProps<T extends (...args: any) => any> = Parameters<T> extends [infer First]
    ? undefined extends First
        ? NoProps
        : First
    : NoProps;

function makeDecoratableComponent<T extends GenericComponent>(
    name: string,
    Component: T = nullRenderer as unknown as T
) {
    const Decoratable = (props: GetProps<T>): JSX.Element | null => {
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

    return withDecoratorFactory()(Decoratable as DecoratableComponent<typeof Decoratable>);
}

export function makeDecoratableHook<T extends GenericHook>(hook: T) {
    const decoratableHook = (params: Parameters<T>) => {
        const composedHook = useComponent(hook);

        return composedHook(params) as DecoratableHook<T>;
    };

    decoratableHook.original = hook;

    return withHookDecoratorFactory()(decoratableHook as DecoratableHook<T>);
}

export function createVoidComponent<T>() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (props: T): JSX.Element | null => {
        return null;
    };
}

export function makeDecoratable<T extends GenericHook>(
    hook: T
): ReturnType<typeof makeDecoratableHook<T>>;
export function makeDecoratable<T extends GenericComponent>(
    name: string,
    Component: T
): ReturnType<typeof makeDecoratableComponent<T>>;
export function makeDecoratable(hookOrName: any, Component?: any) {
    if (Component) {
        return makeDecoratableComponent(hookOrName, Component);
    }

    return makeDecoratableHook(hookOrName);
}
