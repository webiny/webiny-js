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
    scope
}: {
    store: ReturnType<typeof useCompositionStore>;
    target: any;
    decorators: Decorator<GenericComponent | GenericHook>[];
    scope: string;
}) {
    const prevRef = useRef<{
        decorators: Decorator<GenericComponent | GenericHook>[];
        scope: string;
    } | null>(null);

    useEffect(() => {
        const prev = prevRef.current;

        // On prop change: unregister old decorators.
        if (prev && (prev.decorators !== decorators || prev.scope !== scope)) {
            store.unregister(target, prev.decorators, prev.scope);
            // Re-register new ones (they were already registered during render,
            // but the idempotency check handles this).
            store.register(target, decorators, scope);
        }

        prevRef.current = { decorators, scope };

        // Cleanup on unmount.
        return () => {
            store.unregister(target, decorators, scope);
        };
    }, [store, target, decorators, scope]);

    return null;
}
