import { HigherOrderComponent } from "@webiny/react-composition";

/**
 * Creates a Higher Order Component which is meant to wrap the entire app content.
 * This is mostly useful for adding React Context providers.
 */
export function createProvider(hoc: HigherOrderComponent): HigherOrderComponent {
    return hoc;
}
