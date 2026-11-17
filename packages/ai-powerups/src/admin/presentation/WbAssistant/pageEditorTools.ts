import type { AssistantClientTool } from "@webiny/app-admin";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import type { Document } from "@webiny/website-builder-sdk";
import { componentCatalog } from "./pageOutline.js";

/**
 * What the tools need from the page editor. Kept narrow so the tools can be tested without one, and
 * so every change goes through the editor's own commands: undo, constraints and the canvas all work
 * the way they do for a change made by hand.
 */
export interface PageEditorAccess {
    components(): Record<string, ComponentManifest>;
    document(): Pick<Document, "elements" | "bindings">;
    createElement(params: {
        componentName: string;
        parentId: string;
        slot: string;
        index?: number;
        bindings: { inputs: Record<string, unknown>; styles?: Record<string, unknown> };
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
    resolveValues(value: unknown): Promise<unknown>;
    /** The envelopes `resolveValues` understands, as the model needs to write them. */
    valueTools(): { name: string; description: string; inputSchema: unknown }[];
}

interface ElementInput {
    component: string;
    inputs?: Record<string, unknown>;
    styles?: Record<string, unknown>;
}

/** More than this is not something the model needs to see to change one element. */
const MAX_INPUTS_LENGTH = 6000;

const GRID_LAYOUTS = ["12", "6-6", "4-4-4", "8-4", "4-8", "3-3-3-3"];

/**
 * How to write elements. The same rules the one-shot page generator gives its model
 * (`WbGeneratePageContent/buildPrompt.ts`), cut to what holds for editing as well as generating.
 */
const BUILDING_RULES = `Elements are { "component": "<name>", "inputs": { ... } }.
- Only use component names from this catalog. Input names come from each component's inputs.
- Plain values (text, number, boolean, select) are set directly.
- Values that need converting are written as an envelope: { "tool": "<valueTool>", "params": { ... } }. Rich text ("lexical" inputs) is { "tool": "textToLexical", "params": { "text": "<html>" } }.
- A slot input takes elements written as { "action": "CreateElement", "params": { "component": "...", "inputs": { ... } } }; a list slot takes an array of them.
- Webiny/Grid: "gridLayout" is one of ${GRID_LAYOUTS.join(", ")}. "columns" is an array; each column is { "children": { "action": "CreateElement", "params": { "component": "Webiny/GridColumn", "inputs": { "children": [ <CreateElement actions> ] } } } }.
- One Webiny/Lexical element can hold a whole section: headings, paragraphs and lists in one HTML string. Use one <h1> per page, then <h2> and <h3> in order.
- Images: call listImagesByTag first and use an id it returned, as { "tool": "resolveImage", "params": { "id": "<id>" } }. Never invent an id; leave the image out when nothing fits.`;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readElements = (value: unknown): ElementInput[] => {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error("`elements` must be a non-empty array of { component, inputs }.");
    }
    return value.map((entry, index) => {
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
    });
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

/** Ids of the elements in a parent's slot, in canvas order. */
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

/**
 * The page editor's tools for the assistant. They run in the browser, against the page open in the
 * editor: a change shows on the canvas at once, undo takes it back, and nothing is stored until the
 * user saves.
 */
export const createPageEditorTools = (access: PageEditorAccess): AssistantClientTool[] => {
    const assertComponent = (name: string) => {
        if (!access.components()[name]) {
            throw new Error(
                `There is no component named "${name}". Call listPageComponents for the names.`
            );
        }
    };

    const assertElement = (id: string) => {
        if (!access.document().elements[id]) {
            throw new Error(`There is no element "${id}" on the page.`);
        }
    };

    return [
        {
            name: "listPageComponents",
            description:
                "Lists the components the page editor can place, with their inputs, the value tools for inputs that need converting, and the rules for writing elements. Call it once before adding or changing elements.",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                return {
                    components: componentCatalog(access.components()),
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
            async execute(input) {
                const { elementId } = input as { elementId: string };
                assertElement(elementId);
                const element = access.document().elements[elementId];
                return {
                    id: elementId,
                    component: element.component.name,
                    inputs: truncate(access.readInputs(elementId))
                };
            }
        },
        {
            name: "addPageElements",
            description:
                "Adds elements to the page open in the editor, in order. Nested elements go in slot inputs as CreateElement actions, so a whole section is one element. The change shows on the canvas at once and is not saved until the user saves the page.",
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
                const index = typeof input["index"] === "number" ? input["index"] : undefined;
                const elements = readElements(input["elements"]);

                if (parentId !== "root") {
                    assertElement(parentId);
                }
                elements.forEach(element => assertComponent(element.component));

                const added: { id: string; component: string }[] = [];
                for (const [offset, element] of elements.entries()) {
                    const inputs = (await access.resolveValues(element.inputs ?? {})) as Record<
                        string,
                        unknown
                    >;
                    const before = new Set(childrenOf(access, parentId, slot));
                    await access.createElement({
                        componentName: element.component,
                        parentId,
                        slot,
                        index: index === undefined ? undefined : index + offset,
                        bindings: element.styles ? { inputs, styles: element.styles } : { inputs }
                    });
                    const created = childrenOf(access, parentId, slot).find(id => !before.has(id));
                    if (!created) {
                        throw new Error(
                            `"${element.component}" can't go in the "${slot}" slot of "${parentId}".` +
                                (added.length > 0
                                    ? ` ${added.length} element(s) before it were added.`
                                    : "")
                        );
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
                if (!isRecord(input["inputs"])) {
                    throw new Error('"inputs" must be an object of input values.');
                }
                const inputs = (await access.resolveValues(input["inputs"])) as Record<
                    string,
                    unknown
                >;
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
                const index = typeof input["index"] === "number" ? input["index"] : 0;
                assertElement(elementId);
                await access.moveElement({ elementId, parentId, slot, index });
                const element = access.document().elements[elementId];
                if (element?.parent?.id !== parentId || element.parent.slot !== slot) {
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
                const ids = Array.isArray(input["elementIds"])
                    ? input["elementIds"].filter((id): id is string => typeof id === "string")
                    : [];
                const deleted: string[] = [];
                const kept: string[] = [];
                for (const id of ids) {
                    assertElement(id);
                    await access.deleteElement(id);
                    if (access.document().elements[id]) {
                        kept.push(id);
                    } else {
                        deleted.push(id);
                    }
                }
                return kept.length > 0
                    ? { deleted, notDeleted: kept, reason: "These can't be deleted." }
                    : { deleted };
            }
        }
    ];
};
