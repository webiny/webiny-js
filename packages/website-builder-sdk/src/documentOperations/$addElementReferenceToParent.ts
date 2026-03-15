import type { Document } from "~/types.js";
import type { InputValueBinding } from "~/types.js";

interface Params {
    elementId: string;
    parentId: string;
    slot: string;
    index?: number;
}

export function $addElementReferenceToParent(
    document: Document,
    { elementId, parentId, slot, index }: Params
) {
    const bindings = document.bindings[parentId] ?? {};
    const inputs = bindings.inputs ?? {};

    if (index !== undefined && index < 0) {
        // Single value slot
        inputs[slot] = {
            ...inputs[slot],
            type: "slot",
            static: elementId
        };
    } else {
        const slotElements = inputs[slot] as InputValueBinding;
        const existing = slotElements?.static ?? [];

        let staticValue;
        if (index === undefined) {
            staticValue = [...existing, elementId];
        } else {
            staticValue = [...existing.slice(0, index), elementId, ...existing.slice(index)];
        }

        inputs[slot] = {
            ...inputs[slot],
            type: "slot",
            list: true,
            static: staticValue
        };
    }

    document.bindings[parentId] = {
        ...bindings,
        inputs
    };
}
