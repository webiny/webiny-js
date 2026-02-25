import type { ComponentType } from "react";
import { compose } from "~/Context.js";
import type { Decorator, GenericComponent, GenericHook } from "~/types.js";

interface ComposedComponent {
    component: GenericHook | GenericComponent;
    hocs: Decorator<GenericComponent | GenericHook>[];
}

type ComposedComponents = Map<ComponentType<unknown>, ComposedComponent>;
type ComponentScopes = Map<string, ComposedComponents>;

type Listener = () => void;

export class CompositionStore {
    private scopes: ComponentScopes = new Map();
    private version = 0;
    private listeners = new Set<Listener>();

    register(
        component: ComponentType<unknown>,
        hocs: Decorator<GenericComponent | GenericHook>[],
        scope = "*",
        inherit = false,
        silent = false
    ): () => void {
        const scopeMap: ComposedComponents = this.scopes.get(scope) || new Map();
        const recipe = scopeMap.get(component) || {
            component: component as any,
            hocs: [] as Decorator<GenericComponent | GenericHook>[]
        };

        // Idempotent: skip if all HOCs are already registered (handles StrictMode double-render).
        const newHocs = hocs.filter(hoc => !recipe.hocs.includes(hoc));
        if (newHocs.length === 0) {
            return () => this.unregister(component, hocs, scope);
        }

        const existingHocs = [...recipe.hocs];
        if (inherit && scope !== "*") {
            const globalScope = this.scopes.get("*") || new Map();
            const globalRecipe = globalScope.get(component) || {
                component: component as any,
                hocs: [] as Decorator<GenericComponent | GenericHook>[]
            };
            // Only prepend global HOCs that aren't already present.
            const globalHocsToAdd = globalRecipe.hocs.filter(
                (hoc: Decorator<GenericComponent | GenericHook>) => !existingHocs.includes(hoc)
            );
            existingHocs.unshift(...globalHocsToAdd);
        }

        const finalHocs = [...existingHocs, ...newHocs];

        scopeMap.set(component, {
            component: compose(...[...finalHocs].reverse())(component as any),
            hocs: finalHocs
        });

        this.scopes.set(scope, scopeMap);

        // Bump the version so useSyncExternalStore sees a new snapshot.
        this.version++;

        // When called during render (silent=true), don't notify listeners —
        // that would trigger setState in other components mid-render.
        // Components that render after this point will see the updated snapshot.
        if (!silent) {
            this.notifyListeners();
        }

        return () => this.unregister(component, hocs, scope);
    }

    unregister(
        component: ComponentType<unknown>,
        hocs: Decorator<GenericComponent | GenericHook>[],
        scope = "*"
    ): void {
        const scopeMap = this.scopes.get(scope);
        if (!scopeMap) {
            return;
        }

        const recipe = scopeMap.get(component);
        if (!recipe) {
            return;
        }

        const newHocs = recipe.hocs.filter(hoc => !hocs.includes(hoc));
        if (newHocs.length === recipe.hocs.length) {
            // Nothing was removed.
            return;
        }

        if (newHocs.length === 0) {
            scopeMap.delete(component);
        } else {
            scopeMap.set(component, {
                component: compose(...[...newHocs].reverse())(component as any),
                hocs: newHocs
            });
        }

        this.version++;
        this.notifyListeners();
    }

    getComponent(
        component: ComponentType<unknown>,
        scope: string[] = []
    ): GenericComponent | GenericHook | undefined {
        const scopesToResolve = ["*", ...scope].reverse();
        for (const s of scopesToResolve) {
            const scopeMap = this.scopes.get(s);
            if (!scopeMap) {
                continue;
            }
            const composed = scopeMap.get(component);
            if (composed) {
                return composed.component;
            }
        }
        return undefined;
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = (): number => {
        return this.version;
    };

    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
