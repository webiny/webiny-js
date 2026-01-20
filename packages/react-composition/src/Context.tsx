import type { ComponentType } from "react";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useCompositionScope } from "~/CompositionScope.js";
import type {
    ComposedFunction,
    ComposeWith,
    Decoratable,
    DecoratableComponent,
    DecoratableHook,
    Decorator,
    Enumerable,
    GenericComponent,
    GenericHook
} from "~/types.js";

export function compose<T>(...fns: Decorator<T>[]) {
    return (decoratee: T): T => {
        return fns.reduceRight((decoratee, decorator) => decorator(decoratee), decoratee) as T;
    };
}

interface ComposedComponent {
    /**
     * Ready to use React component.
     */
    component: GenericHook | GenericComponent;
    /**
     * HOCs used to compose the original component.
     */
    hocs: Decorator<GenericComponent | GenericHook>[];
    /**
     * Component composition can be scoped.
     */
    scope?: string;
}

/**
 * @deprecated Use `Decorator` instead.
 */
export interface HigherOrderComponent<TProps = any, TOutput = TProps> {
    (Component: GenericComponent<TProps>): GenericComponent<TOutput>;
}

type ComposedComponents = Map<ComponentType<unknown>, ComposedComponent>;
type ComponentScopes = Map<string, ComposedComponents>;

export type DecoratableTypes = DecoratableComponent | DecoratableHook;

interface CompositionContextGetComponentCallable {
    (
        component: ComponentType<unknown>,
        scope: string[]
    ): ComposedFunction | GenericComponent | undefined;
}

interface CompositionContextValue {
    components: ComponentScopes;
    getComponent: CompositionContextGetComponentCallable;
    composeComponent(
        component: ComponentType<unknown>,
        hocs: Enumerable<ComposeWith>,
        scope?: string,
        inherit?: boolean
    ): void;
}

const CompositionContext = createContext<CompositionContextValue | undefined>(undefined);

export type DecoratorsTuple = [Decoratable, Decorator<any>[]];
export type DecoratorsCollection = Array<DecoratorsTuple>;

interface CompositionProviderProps {
    decorators?: DecoratorsCollection;
    children: React.ReactNode;
}

const composeComponents = (
    components: ComponentScopes,
    decorators: Array<[GenericComponent | GenericHook, Decorator<any>[]]>,
    scope = "*",
    inherit = false
) => {
    const scopeMap: ComposedComponents = components.get(scope) || new Map();
    for (const [component, newHocs] of decorators) {
        const recipe = scopeMap.get(component) || { component: null, hocs: [] };

        const existingHocs = [...(recipe.hocs || [])];
        if (inherit && scope !== "*") {
            const globalScope = components.get("*") || new Map();
            const globalRecipe = globalScope.get(component) || { component: null, hocs: [] };
            existingHocs.unshift(...globalRecipe.hocs);
        }

        const finalHocs = [...existingHocs, ...newHocs] as Decorator<
            GenericHook | GenericComponent
        >[];

        scopeMap.set(component, {
            component: compose(...[...finalHocs].reverse())(component),
            hocs: finalHocs
        });

        components.set(scope, scopeMap);
    }

    return components;
};

export const CompositionProvider = ({ decorators = [], children }: CompositionProviderProps) => {
    const [components, setComponents] = useState<ComponentScopes>(() => {
        return composeComponents(
            new Map(),
            decorators.map(tuple => {
                return [tuple[0].original, tuple[1]];
            })
        );
    });

    const composeComponent = useCallback(
        (
            component: GenericComponent | GenericHook,
            hocs: HigherOrderComponent<any, any>[],
            scope: string | undefined = "*",
            inherit = false
        ) => {
            setComponents(prevComponents => {
                return composeComponents(
                    new Map(prevComponents),
                    [[component, hocs]],
                    scope,
                    inherit
                );
            });

            // Return a function that will remove the added HOCs.
            return () => {
                setComponents(prevComponents => {
                    const components = new Map(prevComponents);
                    const scopeMap: ComposedComponents = components.get(scope) || new Map();
                    const recipe = scopeMap.get(component) || {
                        component: null,
                        hocs: []
                    };

                    const newHOCs = [...recipe.hocs].filter(hoc => !hocs.includes(hoc));
                    const NewComponent = compose(...[...newHOCs].reverse())(component);

                    scopeMap.set(component, {
                        component: NewComponent,
                        hocs: newHOCs
                    });

                    components.set(scope, scopeMap);
                    return components;
                });
            };
        },
        [setComponents]
    );

    const getComponent = useCallback<CompositionContextGetComponentCallable>(
        (Component, scope = []) => {
            const scopesToResolve = ["*", ...scope].reverse();
            for (const scope of scopesToResolve) {
                const scopeMap: ComposedComponents = components.get(scope) || new Map();
                const composedComponent = scopeMap.get(Component);
                if (composedComponent) {
                    return composedComponent.component;
                }
            }

            return undefined;
        },
        [components]
    );

    const context: CompositionContextValue = useMemo(
        () => ({
            getComponent,
            composeComponent,
            components
        }),
        [components, composeComponent]
    );

    return <CompositionContext.Provider value={context}>{children}</CompositionContext.Provider>;
};

export function useComponent<T>(baseFunction: T) {
    const context = useOptionalComposition();
    const scope = useCompositionScope();

    if (!context) {
        return baseFunction;
    }

    return (context.getComponent(baseFunction as any, scope.scope) || baseFunction) as T;
}

/**
 * This hook will throw an error if composition context doesn't exist.
 */
export function useComposition() {
    const context = useContext(CompositionContext);
    if (!context) {
        throw new Error(
            `You're missing a <CompositionProvider> higher up in your component hierarchy!`
        );
    }

    return context;
}

/**
 * This hook will not throw an error if composition context doesn't exist.
 */
export function useOptionalComposition() {
    return useContext(CompositionContext);
}
