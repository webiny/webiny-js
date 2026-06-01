import type { ComponentPropsWithChildren } from "~/types.js";

/**
 * A generic container that renders only its children slot.
 */
export const BoxComponent = (props: ComponentPropsWithChildren) => {
    return props.inputs?.children ?? null;
};
