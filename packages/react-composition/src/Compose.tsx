import React, { useEffect, useRef } from "react";
import type { DecoratableTypes } from "./Context.js";
import { useCompositionStore } from "./Context.js";
import { useCompositionScope } from "~/CompositionScope.js";
import type {
    ComposeWith,
    Decoratable,
    Decorator,
    GenericComponent,
    GenericHook
} from "./types.js";

export interface ComposeProps {
    function?: DecoratableTypes;
    component?: DecoratableTypes;
    with: ComposeWith;
}

export const Compose = (props: ComposeProps) => {
    const store = useCompositionStore();
    const { scope, inherit } = useCompositionScope();

    const targetFn = (props.function ?? props.component) as Decoratable;

    if (!targetFn) {
        console.warn("You must provide a function or a component to compose with!", props);
        return null;
    }

    if (typeof targetFn.original === "undefined") {
        console.warn(
            `You must make your function "${
                targetFn.originalName ?? targetFn.name
            }" composable, by using the makeDecoratable() function!`
        );
        return null;
    }

    const decorators = (Array.isArray(props.with) ? props.with : [props.with]) as Decorator<
        GenericComponent | GenericHook
    >[];
    const currentScope = scope[scope.length - 1] ?? "*";

    // Register synchronously during render so decorators are available immediately.
    // Pass silent=true to avoid notifying listeners mid-render (which would trigger
    // setState in other components and cause React warnings).
    store.register(targetFn.original, decorators, currentScope, inherit, true);

    return (
        <ComposeEffects
            store={store}
            target={targetFn.original}
            decorators={decorators}
            scope={currentScope}
            inherit={inherit}
        />
    );
};

/**
 * Separate component for the effect to avoid re-running the cleanup on every render.
 * This component handles cleanup on unmount and when props change.
 */
function ComposeEffects({
    store,
    target,
    decorators,
    scope,
    inherit
}: {
    store: ReturnType<typeof useCompositionStore>;
    target: any;
    decorators: Decorator<GenericComponent | GenericHook>[];
    scope: string;
    inherit: boolean;
}) {
    const prevRef = useRef<{
        decorators: Decorator<GenericComponent | GenericHook>[];
        scope: string;
    } | null>(null);

    // Tracks the decorators currently live in the store as of the last render.
    // Updated synchronously during render so it always reflects the most recently
    // registered decorators, allowing the atomic swap below to remove the right ones.
    const liveRef = useRef<Decorator<GenericComponent | GenericHook>[]>(decorators);

    // On re-render with new decorators: atomically replace the old ones in the store
    // during render (before React commits). This ensures the store never transiently
    // holds both old and new HOCs — which would cause useSyncExternalStore subscribers
    // to render with a doubly-wrapped component and mount inner components twice.
    if (liveRef.current !== decorators) {
        store.register(target, decorators, scope, inherit, true, liveRef.current);
        liveRef.current = decorators;
    }

    useEffect(() => {
        const prev = prevRef.current;

        // On prop change: the render-phase atomic swap already updated the store.
        // Emit a non-silent notification now that effects have settled so subscribers
        // re-render with the final, clean composition (old HOCs fully gone).
        if (prev && (prev.decorators !== decorators || prev.scope !== scope)) {
            store.notify();
        }

        prevRef.current = { decorators, scope };

        // Cleanup on unmount.
        return () => {
            store.unregister(target, decorators, scope);
        };
    }, [store, target, decorators, scope]);

    return null;
}
