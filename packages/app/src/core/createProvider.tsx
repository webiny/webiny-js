import React from "react";
import { Decorator, GenericComponent } from "@webiny/react-composition";

export interface ChildrenProps {
    children: React.ReactNode;
}

/**
 * Creates a Higher Order Component which wraps the entire app content.
 * This is mostly useful for adding React Context providers.
 */
export function createProvider(
    decorator: Decorator<GenericComponent<ChildrenProps>>
): Decorator<GenericComponent<ChildrenProps>> {
    return decorator;
}
