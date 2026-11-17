import get from "lodash/get.js";
import type { ComponentManifest, Document } from "@webiny/website-builder-sdk";

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

const indexInSlot = (
    bindings: Document["bindings"],
    elementId: string,
    parentId: string,
    slot: string
): number => {
    const slotValue = get(bindings[parentId], `inputs.${slot}`);
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
        siblings.push({
            element: { id: element.id, component: element.component.name, slot, children: [] },
            slot,
            index: indexInSlot(document.bindings, element.id, parentId, slot)
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

/** The editor's components, as the assistant needs them to build elements. */
export const componentCatalog = (components: Record<string, ComponentManifest>) => {
    return Object.values(components)
        .filter(component => component.useInAiContentGeneration !== false && !component.global)
        .map(component => ({
            name: component.name,
            label: component.label,
            aiContext: component.aiContext,
            inputs: component.inputs.map(input => ({
                type: input.type,
                name: input.name,
                label: input.label,
                description: input.description
            }))
        }));
};

/**
 * The outline as indented lines, "<id> <component>", with the slot when it is not `children`. Lines
 * rather than nested objects: the same tree in about half the characters, and the page context is
 * capped.
 */
export const outlineLines = (elements: OutlineElement[], depth = 0): string[] => {
    return elements.flatMap(element => {
        const slot = element.slot === "children" ? "" : ` in ${element.slot}`;
        const line = `${"  ".repeat(depth)}${element.id} ${element.component}${slot}`;
        return [line, ...outlineLines(element.children, depth + 1)];
    });
};
