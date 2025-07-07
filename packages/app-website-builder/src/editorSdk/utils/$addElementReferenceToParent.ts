import type { Document } from "~/sdk/types.js";
import type { InputValueBinding } from "~/sdk/types";

interface Params {
    elementId: string;
    parentId: string;
    slot: string;
    index: number;
}

export function $addElementReferenceToParent(
    document: Document,
    { elementId, parentId, slot, index }: Params
) {
    const bindings = document.bindings[parentId] ?? {};
    const inputs = bindings.inputs ?? {};

    if (index < 0) {
        // Single value slot
        inputs[slot] = {
            ...inputs[slot],
            type: "slot",
            static: elementId
        };
    } else {
        const slotElements = inputs[slot] as InputValueBinding;
        inputs[slot] = {
            ...inputs[slot],
            type: "slot",
            list: true,
            static: [
                ...(slotElements?.static ?? []).slice(0, index),
                elementId,
                ...(slotElements?.static ?? []).slice(index)
            ]
        };
    }

    document.bindings[parentId] = {
        ...bindings,
        inputs
    };
}
