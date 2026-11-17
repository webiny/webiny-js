import type { Document } from "@webiny/website-builder-sdk";

/** One element of the page, as the assistant is told of it. */
export interface OutlineElement {
    id: string;
    component: string;
    /** The slot of the parent it sits in, `children` for most. */
    slot: string;
    children: OutlineElement[];
}

/** More than this and the outline stops listing: it goes into every question's system prompt. */
const MAX_ELEMENTS = 120;

const isGlobal = (id: string) => id.startsWith("$global");

/*
 * Where an element sits in its parent's slot, read the way the renderer reads it
 * (`BindingsResolver`): indexed `<slot>/<n>` bindings first, the slot's own array when there are none.
 */
const indexInSlot = (
    bindings: Document["bindings"],
    elementId: string,
    parentId: string,
    slot: string
): number => {
    const inputs: Record<string, { static?: unknown; list?: boolean }> =
        bindings[parentId]?.inputs ?? {};

    const prefix = `${slot}/`;
    for (const [key, binding] of Object.entries(inputs)) {
        if (!key.startsWith(prefix) || binding?.static !== elementId) {
            continue;
        }
        const position = Number(key.slice(prefix.length));
        if (Number.isInteger(position)) {
            return position;
        }
    }

    const slotValue = inputs[slot];
    if (slotValue?.list && Array.isArray(slotValue.static)) {
        return slotValue.static.indexOf(elementId);
    }
    return 0;
};

/**
 * The page's elements as a tree under `root`, in the order they are on the canvas. Ids and component
 * names only: what an element holds is read with `getPageElement` when a question is about it.
 * Global components are left out, since the page does not own them.
 */
export const pageOutline = (document: Pick<Document, "elements" | "bindings">) => {
    const byParent = new Map<string, { element: OutlineElement; slot: string; index: number }[]>();
    let count = 0;

    for (const element of Object.values(document.elements)) {
        if (element.id === "root" || isGlobal(element.id) || !element.parent) {
            continue;
        }
        const { id: parentId, slot } = element.parent;
        const siblings = byParent.get(parentId) ?? [];
        const index = indexInSlot(document.bindings, element.id, parentId, slot);
        siblings.push({
            element: { id: element.id, component: element.component.name, slot, children: [] },
            slot,
            index
        });
        byParent.set(parentId, siblings);
    }

    const build = (parentId: string): OutlineElement[] => {
        const siblings = byParent.get(parentId) ?? [];
        siblings.sort((a, b) => a.slot.localeCompare(b.slot) || a.index - b.index);

        const result: OutlineElement[] = [];
        for (const { element } of siblings) {
            if (count >= MAX_ELEMENTS) {
                break;
            }
            count++;
            element.children = build(element.id);
            result.push(element);
        }
        return result;
    };

    const elements = build("root");
    const total = Object.keys(document.elements).filter(id => id !== "root" && !isGlobal(id));
    return { elements, truncated: total.length > count };
};
