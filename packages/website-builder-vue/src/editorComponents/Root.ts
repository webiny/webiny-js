import type { ComponentPropsWithChildren } from "~/types.js";

/**
 * The invisible root container — renders only its children slot.
 */
export const RootComponent = (props: ComponentPropsWithChildren) => {
    return props.inputs?.children ?? null;
};
