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
        // Serialize constraint functions for cross-boundary transport
        if (component.manifest.constraints) {
            for (const constraint of component.manifest.constraints) {
                // @ts-expect-error Serialized form is a string, but type expects a function.
                constraint.check = functionConverter.serialize(constraint.check);
            }
        }
        if (component.manifest.descendantConstraints) {
            for (const constraint of component.manifest.descendantConstraints) {
                // @ts-expect-error Serialized form is a string, but type expects a function.
                constraint.check = functionConverter.serialize(constraint.check);
            }
        }
        if (
            component.manifest.canDelete &&
            typeof component.manifest.canDelete === "object" &&
            typeof component.manifest.canDelete.check === "function"
        ) {
            // @ts-expect-error Serialized form is a string, but type expects a function.
            component.manifest.canDelete.check = functionConverter.serialize(
                component.manifest.canDelete.check
            );
        }
        if (component.manifest.onChange && typeof component.manifest.onChange === "function") {
            // @ts-expect-error Serialized form is a string, but type expects a function.
            component.manifest.onChange = functionConverter.serialize(component.manifest.onChange);
        }
        if (
            component.manifest.onDescendantChange &&
            typeof component.manifest.onDescendantChange === "function"
        ) {
            // @ts-expect-error Serialized form is a string, but type expects a function.
            component.manifest.onDescendantChange = functionConverter.serialize(
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

    /** subscribe to *all* registrations */
    public onRegister(fn: (reg: Registration) => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
}

export const componentRegistry = new ComponentRegistry();
