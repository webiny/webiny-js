import type { ComponentPropsWithChildren } from "~/types.js";

/** Renders only its children slot (the column content). */
export const GridColumnComponent = (props: ComponentPropsWithChildren) => {
    return props.inputs?.children ?? null;
};
