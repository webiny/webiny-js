import type { Component } from "./types.js";

type RegistrationHandler = (component: Component) => void;

export class ComponentRegistry {
    private registry = new Map<string, Component>();
    private listeners = new Set<RegistrationHandler>();

    register(component: Component) {
        const name = component.manifest.name;
        if (this.registry.has(name)) {
            return;
        }

        this.registry.set(name, component);
        this.listeners.forEach(fn => fn(component));
    }

    get(name: string): Component | undefined {
        return this.registry.get(name);
    }

    getAll(): Component[] {
        return [...this.registry.values()];
    }

    onRegister(fn: RegistrationHandler): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
}

export const componentRegistry = new ComponentRegistry();
