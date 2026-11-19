import type { AssistantClientTools } from "@webiny/app-admin";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import type { Document } from "@webiny/website-builder-sdk";
import { WB_GRID_LAYOUTS } from "~/domain/wbGridLayouts.js";
import { aiComponentCatalog } from "~/admin/presentation/WbAiContext/aiComponentCatalog.js";

/**
 * What the tools need from the page editor. Kept narrow so the tools can be tested without one.
 * Elements are created, moved and deleted through the editor's commands, and inputs change the way
 * the sidebar changes them, so undo, constraints and the canvas work as they do for a change made by
 * hand.
 */
export interface PageEditorAccess {
    components(): Record<string, ComponentManifest>;
    document(): Pick<Document, "elements" | "bindings">;
    createElement(params: {
        componentName: string;
        parentId: string;
        slot: string;
        index?: number;
        /** Left out, an input or the styles take the component's defaults. */
        bindings: { inputs?: Record<string, unknown>; styles?: Record<string, unknown> };
    }): Promise<void>;
    updateInputs(elementId: string, inputs: Record<string, unknown>): void;
    moveElement(params: {
        elementId: string;
        parentId: string;
        slot: string;
        index: number;
    }): Promise<void>;
    deleteElement(elementId: string): Promise<void>;
    readInputs(elementId: string): Record<string, unknown>;
    /** Turns `{ tool, params }` envelopes into values: Lexical state, image references. */
    resolveValues(value: Record<string, unknown>): Promise<Record<string, unknown>>;
    /** The envelopes `resolveValues` understands, as the model needs to write them. */
    valueTools(): unknown[];
}

interface ElementInput {
    component: string;
    inputs?: Record<string, unknown>;
    styles?: Record<string, unknown>;
}

/** More than this is not something the model needs to see to change one element. */
const MAX_INPUTS_LENGTH = 6000;

const gridLayouts = WB_GRID_LAYOUTS.join(", ");

/**
 * How to write elements. The one-shot page generator (`WbGeneratePageContent/buildPrompt.ts`) gives
 * its model the same element format; this is the part of it that holds for editing as well as
 * generating, since the assistant hands elements to a tool rather than returning a page.
 */
const BUILDING_RULES = `Elements are { "component": "<name>", "inputs": { ... } }.
- Only use component names from this catalog. Input names come from each component's inputs.
- Plain values (text, number, boolean, select) are set directly.
- Values that need converting are written as an envelope: { "tool": "<valueTool>", "params": { ... } }. Rich text ("lexical" inputs) is { "tool": "textToLexical", "params": { "text": "<html>" } }.
- A slot input takes elements written as { "action": "CreateElement", "params": { "component": "...", "inputs": { ... } } }; a list slot takes an array of them.
- Webiny/Grid: "gridLayout" is one of ${gridLayouts}. "columns" is an array; each column is { "children": { "action": "CreateElement", "params": { "component": "Webiny/GridColumn", "inputs": { "children": [ <CreateElement actions> ] } } } }.
- One Webiny/Lexical element can hold a whole section: headings, paragraphs and lists in one HTML string. Use one <h1> per page, then <h2> and <h3> in order.
- Images: call listImagesByTag first and use an id it returned, as { "tool": "resolveImage", "params": { "id": "<id>" } }. Never invent an id; leave the image out when nothing fits.`;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readElement = (entry: unknown, index: number): ElementInput => {
    if (!isRecord(entry) || typeof entry["component"] !== "string") {
        throw new Error(`Element ${index} needs a "component" name.`);
    }
    const element: ElementInput = { component: entry["component"] };
    if (isRecord(entry["inputs"])) {
        element.inputs = entry["inputs"];
    }
    if (isRecord(entry["styles"])) {
        element.styles = entry["styles"];
    }
    return element;
};

const readElements = (value: unknown): ElementInput[] => {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error("`elements` must be a non-empty array of { component, inputs }.");
    }
    return value.map(readElement);
};

const readString = (input: Record<string, unknown>, key: string, fallback?: string): string => {
    const value = input[key];
    if (typeof value === "string" && value) {
        return value;
    }
    if (fallback !== undefined) {
        return fallback;
    }
    throw new Error(`"${key}" is required.`);
};

const readStrings = (value: unknown): string[] => {
    const strings: string[] = [];
    if (!Array.isArray(value)) {
        return strings;
    }
    for (const entry of value) {
        if (typeof entry === "string") {
            strings.push(entry);
        }
    }
    return strings;
};

/** A position in a slot: a whole number from 0. Absent when the model left it out. */
const readIndex = (input: Record<string, unknown>): number | undefined => {
    const value = input["index"];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error('"index" must be a whole number from 0.');
    }
    return value;
};

/** Ids of the elements in a parent's slot. */
const childrenOf = (access: PageEditorAccess, parentId: string, slot: string): string[] => {
    const { elements } = access.document();
    return Object.values(elements)
        .filter(element => element.parent?.id === parentId && element.parent.slot === slot)
        .map(element => element.id);
};

const truncate = (value: unknown): unknown => {
    const serialized = JSON.stringify(value);
    if (serialized.length <= MAX_INPUTS_LENGTH) {
        return value;
    }
    return { truncated: true, json: serialized.slice(0, MAX_INPUTS_LENGTH) };
};

const notPlaced = (component: string, slot: string, parentId: string, added: number) => {
    let message = `"${component}" can't go in the "${slot}" slot of "${parentId}".`;
    if (added > 0) {
        message += ` ${added} element(s) before it were added.`;
    }
    return new Error(message);
};

/**
 * The page editor's tools for the assistant. They run in the browser, against the page open in the
 * editor: a change shows on the canvas at once, the editor saves it to the page's draft as it does
 * a change made by hand, and undo takes it back.
 */
export const createPageEditorTools = (access: PageEditorAccess): AssistantClientTools.Tool[] => {
    const assertComponent = (name: string) => {
        const components = access.components();
        if (!components[name]) {
            throw new Error(
                `There is no component named "${name}". Call listPageComponents for the names.`
            );
        }
    };

    const assertElement = (id: string) => {
        const { elements } = access.document();
        if (!elements[id]) {
            throw new Error(`There is no element "${id}" on the page.`);
        }
    };

    // An element moved into itself, or into anything inside it, would leave the page with both.
    const assertNotInside = (parentId: string, elementId: string) => {
        const { elements } = access.document();
        const visited = new Set<string>();
        let current: string | undefined = parentId;
        while (current && !visited.has(current)) {
            if (current === elementId) {
                throw new Error(`"${elementId}" can't be moved into itself.`);
            }
            visited.add(current);
            current = elements[current]?.parent?.id;
        }
    };

    return [
        {
            name: "listPageComponents",
            description:
                "Lists the components the page editor can place, with their inputs, the value tools for inputs that need converting, and the rules for writing elements. Call it once before adding or changing elements.",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                // Global components have one instance per site, placed by the layout, not the page.
                const components = access.components();
                const manifests = Object.values(components);
                const placeable = manifests.filter(component => !component.global);
                return {
                    components: aiComponentCatalog(placeable),
                    valueTools: access.valueTools(),
                    rules: BUILDING_RULES
                };
            }
        },
        {
            name: "getPageElement",
            description:
                "Reads one element of the page open in the editor: its component and current input values. Slot inputs hold the ids of the elements inside.",
            inputSchema: {
                type: "object",
                properties: {
                    elementId: { type: "string", description: "Id from the page outline." }
                },
                required: ["elementId"]
            },
            async execute(raw) {
                const input = isRecord(raw) ? raw : {};
                const elementId = readString(input, "elementId");
                assertElement(elementId);
                const { elements } = access.document();
                const inputs = access.readInputs(elementId);
                return {
                    id: elementId,
                    component: elements[elementId].component.name,
                    inputs: truncate(inputs)
                };
            }
        },
        {
            name: "addPageElements",
            description:
                "Adds elements to the page open in the editor, in order. Nested elements go in slot inputs as CreateElement actions, so a whole section is one element. The change shows on the canvas at once and the editor saves it to the page's draft.",
            inputSchema: {
                type: "object",
                properties: {
                    parentId: {
                        type: "string",
                        description: 'The element to add into. Default "root": the page itself.'
                    },
                    slot: {
                        type: "string",
                        description: 'The slot of the parent. Default "children".'
                    },
                    index: {
                        type: "integer",
                        description: "Position in the slot, from 0. Omit to add at the end."
                    },
                    elements: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                component: { type: "string" },
                                inputs: { type: "object" },
                                styles: {
                                    type: "object",
                                    description: "CSS properties, camelCase. Usually omitted."
                                }
                            },
                            required: ["component"]
                        }
                    }
                },
                required: ["elements"]
            },
            async execute(raw) {
                const input = isRecord(raw) ? raw : {};
                const parentId = readString(input, "parentId", "root");
                const slot = readString(input, "slot", "children");
                const index = readIndex(input);
                const elements = readElements(input["elements"]);

                if (parentId !== "root") {
                    assertElement(parentId);
                }
                elements.forEach(element => assertComponent(element.component));

                const added: { id: string; component: string }[] = [];
                for (const [offset, element] of elements.entries()) {
                    // Without inputs the component's default inputs apply, default children included.
                    const bindings: {
                        inputs?: Record<string, unknown>;
                        styles?: Record<string, unknown>;
                    } = {};
                    if (element.inputs) {
                        bindings.inputs = await access.resolveValues(element.inputs);
                    }
                    if (element.styles) {
                        bindings.styles = element.styles;
                    }
                    const children = childrenOf(access, parentId, slot);
                    const before = new Set(children);
                    await access.createElement({
                        componentName: element.component,
                        parentId,
                        slot,
                        index: index === undefined ? undefined : index + offset,
                        bindings
                    });
                    const after = childrenOf(access, parentId, slot);
                    const created = after.find(id => !before.has(id));
                    if (!created) {
                        throw notPlaced(element.component, slot, parentId, added.length);
                    }
                    added.push({ id: created, component: element.component });
                }

                return { added };
            }
        },
        {
            name: "updatePageElement",
            description:
                "Changes input values of one element on the page open in the editor. Send only the inputs to change; the rest stay. To change what is inside a slot, add, move or delete the elements in it instead.",
            inputSchema: {
                type: "object",
                properties: {
                    elementId: { type: "string" },
                    inputs: { type: "object" }
                },
                required: ["elementId", "inputs"]
            },
            async execute(raw) {
                const input = isRecord(raw) ? raw : {};
                const elementId = readString(input, "elementId");
                assertElement(elementId);
                const values = input["inputs"];
                if (!isRecord(values)) {
                    throw new Error('"inputs" must be an object of input values.');
                }
                const inputs = await access.resolveValues(values);
                access.updateInputs(elementId, inputs);
                return { updated: elementId, inputs: Object.keys(inputs) };
            }
        },
        {
            name: "movePageElement",
            description: "Moves an element of the page open in the editor to another position.",
            inputSchema: {
                type: "object",
                properties: {
                    elementId: { type: "string" },
                    parentId: { type: "string", description: 'Default "root".' },
                    slot: { type: "string", description: 'Default "children".' },
                    index: { type: "integer", description: "Position in the slot, from 0." }
                },
                required: ["elementId", "index"]
            },
            async execute(raw) {
                const input = isRecord(raw) ? raw : {};
                const elementId = readString(input, "elementId");
                const parentId = readString(input, "parentId", "root");
                const slot = readString(input, "slot", "children");
                const index = readIndex(input) ?? 0;
                assertElement(elementId);
                if (parentId !== "root") {
                    assertElement(parentId);
                }
                assertNotInside(parentId, elementId);
                await access.moveElement({ elementId, parentId, slot, index });
                const { elements } = access.document();
                const parent = elements[elementId]?.parent;
                if (parent?.id !== parentId || parent.slot !== slot) {
                    throw new Error(`The element can't go in the "${slot}" slot of "${parentId}".`);
                }
                return { moved: elementId };
            }
        },
        {
            name: "deletePageElements",
            description:
                "Deletes elements from the page open in the editor, with everything inside them.",
            inputSchema: {
                type: "object",
                properties: {
                    elementIds: { type: "array", items: { type: "string" } }
                },
                required: ["elementIds"]
            },
            async execute(raw) {
                const input = isRecord(raw) ? raw : {};
                const ids = readStrings(input["elementIds"]);
                // Every id is checked before anything goes, so a bad id deletes nothing.
                ids.forEach(assertElement);

                const deleted: string[] = [];
                const kept: string[] = [];
                for (const id of ids) {
                    const { elements } = access.document();
                    // Gone with a parent deleted earlier in this call.
                    if (!elements[id]) {
                        deleted.push(id);
                        continue;
                    }
                    await access.deleteElement(id);
                    const after = access.document();
                    if (after.elements[id]) {
                        kept.push(id);
                    } else {
                        deleted.push(id);
                    }
                }

                if (kept.length > 0) {
                    return { deleted, notDeleted: kept, reason: "These can't be deleted." };
                }
                return { deleted };
            }
        }
    ];
};
