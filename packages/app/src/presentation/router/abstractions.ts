import React from "react";
import { Abstraction } from "@webiny/di-container";

interface IRouteElementRegistry {
    register(name: string, element: React.ReactElement): void;
    getElement(routeName: string): React.ReactNode | null;
    clear(): void;
    list(): string[];
}

export const RouteElementRegistry = new Abstraction<IRouteElementRegistry>("RouteElementRegistry");

export namespace RouteElementRegistry {
    export type Interface = IRouteElementRegistry;
}
