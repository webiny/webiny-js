import type { ComponentType } from "react";
import React, { createContext, useContext, useRef, useSyncExternalStore } from "react";
import { useCompositionScope } from "~/CompositionScope.js";
import { CompositionStore } from "~/domain/CompositionStore.js";
import type {
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

/**
 * @deprecated Use `Decorator` instead.
 */
export interface HigherOrderComponent<TProps = any, TOutput = TProps> {
    (Component: GenericComponent<TProps>): GenericComponent<TOutput>;
}

export type DecoratableTypes = DecoratableComponent | DecoratableHook;

const CompositionStoreContext = createContext<CompositionStore | undefined>(undefined);

export type DecoratorsTuple = [Decoratable, Decorator<any>[]];
export type DecoratorsCollection = Array<DecoratorsTuple>;

interface CompositionProviderProps {
    decorators?: DecoratorsCollection;
    children: React.ReactNode;
}

export const CompositionProvider = ({ decorators = [], children }: CompositionProviderProps) => {
    const storeRef = useRef<CompositionStore | null>(null);
    if (storeRef.current === null) {
        const store = new CompositionStore();
        // Pre-register decorators from props.
        for (const [decoratable, hocs] of decorators) {
            store.register(decoratable.original as ComponentType<unknown>, hocs);
        }
        storeRef.current = store;
    }

    return (
        <CompositionStoreContext.Provider value={storeRef.current}>
            {children}
        </CompositionStoreContext.Provider>
    );
};

export function useCompositionStore(): CompositionStore {
    const store = useContext(CompositionStoreContext);
    if (!store) {
        throw new Error(
            `You're missing a <CompositionProvider> higher up in your component hierarchy!`
        );
    }
    return store;
}

export function useOptionalCompositionStore(): CompositionStore | undefined {
    return useContext(CompositionStoreContext);
}

export function useComponent<T>(baseFunction: T) {
    const store = useOptionalCompositionStore();
    const scope = useCompositionScope();

    // Subscribe to store changes so we re-render when compositions change.
    useSyncExternalStore(
        store ? store.subscribe : noopSubscribe,
        store ? store.getSnapshot : noopGetSnapshot
    );

    if (!store) {
        return baseFunction;
    }

    return (store.getComponent(baseFunction as any, scope.scope) || baseFunction) as T;
}

const noopSubscribe = () => () => {};
const noopGetSnapshot = () => 0;

// Legacy compatibility — kept for any external consumers.

interface CompositionContextValue {
    composeComponent(
        component: ComponentType<unknown>,
        hocs: Enumerable<ComposeWith>,
        scope?: string,
        inherit?: boolean
    ): () => void;
    getComponent(
        component: ComponentType<unknown>,
        scope: string[]
    ): GenericComponent | GenericHook | undefined;
}

/**
 * This hook will throw an error if composition context doesn't exist.
 */
export function useComposition(): CompositionContextValue {
    const store = useCompositionStore();

    return {
        composeComponent: (component, hocs, scope = "*", inherit = false) => {
            return store.register(component, hocs as any[], scope, inherit);
        },
        getComponent: (component, scope) => {
            return store.getComponent(component, scope);
        }
    };
}

/**
 * This hook will not throw an error if composition context doesn't exist.
 */
export function useOptionalComposition(): CompositionContextValue | undefined {
    const store = useOptionalCompositionStore();
    if (!store) {
        return undefined;
    }

    return {
        composeComponent: (component, hocs, scope = "*", inherit = false) => {
            return store.register(component, hocs as any[], scope, inherit);
        },
        getComponent: (component, scope) => {
            return store.getComponent(component, scope);
        }
    };
}
