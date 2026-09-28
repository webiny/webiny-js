import type { Component } from "~/types.js";
import { functionConverter } from "~/FunctionConverter.js";

type Registration = { name: string; component: Component };

export class ComponentRegistry {
    private registry = new Map<string, Component>();
    private listeners = new Set<(reg: Registration) => void>();

    public register(component: Component) {
        const name = component.manifest.name;
        // Normalize optional fields so downstream code never sees undefined.
        component.manifest.tags = component.manifest.tags ?? [];
        // Serialize constraint and handler functions for cross-boundary transport
        if (component.manifest.constraints) {
            // @ts-expect-error Serialized form is string[], but type expects function[].
            component.manifest.constraints = component.manifest.constraints.map(fn =>
                functionConverter.serialize(fn)
            );
        }
        if (component.manifest.descendantConstraints) {
            // @ts-expect-error Serialized form is string[], but type expects function[].
            component.manifest.descendantConstraints = component.manifest.descendantConstraints.map(
                fn => functionConverter.serialize(fn)
            );
        }
        if (component.manifest.canDelete && typeof component.manifest.canDelete === "function") {
            // @ts-expect-error Serialized form is a string, but type expects a function.
            component.manifest.canDelete = functionConverter.serialize(
                component.manifest.canDelete
            );
        }
        if (component.manifest.onChange) {
            // @ts-expect-error Serialized form is a string (or string[]), but type expects a function.
            component.manifest.onChange = serializeHandlers(component.manifest.onChange);
        }
        if (component.manifest.onDescendantChange) {
            // @ts-expect-error Serialized form is a string (or string[]), but type expects a function.
            component.manifest.onDescendantChange = serializeHandlers(
                component.manifest.onDescendantChange
            );
        }
        this.registry.set(name, component);
        // notify subscribers
        this.listeners.forEach(fn => fn({ name, component }));
    }

    public get(name: string) {
        return this.registry.get(name);
    }

    /**
     * Every registered name.
     *
     * Exists so a failed lookup can say what it DOES have. "Unknown component: X" is the same message
     * whether nothing registered at all, the component registered under a different name, or
     * hydration dropped it — three different bugs with three different fixes, and one investigation
     * had to separate them by hand because the message could not.
     */
    public names(): string[] {
        return [...this.registry.keys()];
    }

    /** subscribe to *all* registrations */
    public onRegister(fn: (reg: Registration) => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
}

function serializeHandlers(
    handler: ((...args: any[]) => any) | ((...args: any[]) => any)[]
): string | string[] {
    if (Array.isArray(handler)) {
        return handler.map(h => functionConverter.serialize(h));
    }
    return functionConverter.serialize(handler);
}

export const componentRegistry = new ComponentRegistry();
