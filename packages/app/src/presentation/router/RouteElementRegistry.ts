import React from "react";
import { createImplementation } from "@webiny/di";
import { RouteElementRegistry } from "./abstractions.js";

class RouteElementRegistryImplementation {
    private readonly elements = new Map<string, React.ReactNode>();

    /** Register a React element for a given route. */
    register(routeName: string, element: React.ReactNode): void {
        this.elements.set(routeName, element);
    }

    /** Get the element for a matched route by name. */
    getElement(routeName: string): React.ReactNode | null {
        return this.elements.get(routeName) ?? null;
    }

    /** Clear all registered elements. Useful in tests or hot reloads. */
    clear(): void {
        this.elements.clear();
    }

    /** List all registered route names. */
    list(): string[] {
        return [...this.elements.keys()];
    }
}

export const DefaultRouteElementRegistry = createImplementation({
    implementation: RouteElementRegistryImplementation,
    abstraction: RouteElementRegistry,
    dependencies: []
});
