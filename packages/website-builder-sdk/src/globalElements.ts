import type { ComponentManifest, DocumentElement, ElementMap, GlobalDocument } from "./types.js";

type PlacementElement = Pick<DocumentElement, "id" | "component">;
type GlobalManifests = Record<string, Pick<ComponentManifest, "global">>;

/**
 * The fixed id of a global component's instance element, e.g. `$global:Demo/Header`.
 * Mirrors `GlobalElementId` in `@webiny/api-website-builder`; keep the two in step.
 */
export class GlobalElementId {
    static readonly PREFIX = "$global:";

    private readonly id: string;

    private constructor(id: string) {
        this.id = id;
    }

    static fromName(name: string): GlobalElementId {
        return new GlobalElementId(`${GlobalElementId.PREFIX}${name}`);
    }

    // From an element id: `null` when it isn't the id of a global's instance element.
    static fromId(id: unknown): GlobalElementId | null {
        return GlobalElementId.isGlobal(id) ? new GlobalElementId(id) : null;
    }

    /**
     * From a placement of a global component: an element in a page or layout tree, with its own id, that
     * renders the global's single instance. A global can be placed any number of times; every placement
     * shows the same instance, so a change to it shows everywhere at once. `null` for any other element.
     */
    static fromPlacement(
        element: PlacementElement | undefined,
        components: GlobalManifests
    ): GlobalElementId | null {
        if (!element?.component || GlobalElementId.isGlobal(element.id)) {
            return null;
        }

        const name = element.component.name;
        return components[name]?.global ? GlobalElementId.fromName(name) : null;
    }

    static isGlobal(id: unknown): id is string {
        return typeof id === "string" && id.startsWith(GlobalElementId.PREFIX);
    }

    static isPlacement(
        element: PlacementElement | undefined,
        components: GlobalManifests
    ): boolean {
        return GlobalElementId.fromPlacement(element, components) !== null;
    }

    /**
     * The element whose bindings an element renders and edits with: a placement renders its global's
     * instance; every other element its own.
     */
    static bindingsIdOf(element: PlacementElement, components: GlobalManifests): string {
        return GlobalElementId.fromPlacement(element, components)?.toString() ?? element.id;
    }

    // The name of the global component this id stands for.
    get name(): string {
        return this.id.slice(GlobalElementId.PREFIX.length);
    }

    equals(other: GlobalElementId | null | undefined): boolean {
        return !!other && other.id === this.id;
    }

    toString(): string {
        return this.id;
    }
}

// The id of the global an element belongs to: the global itself, or the global it sits inside.
export const getGlobalRootId = (elements: ElementMap, id: string): string | null => {
    const visited = new Set<string>();
    let currentId: string | undefined = id;

    while (currentId && !visited.has(currentId)) {
        if (GlobalElementId.isGlobal(currentId)) {
            return currentId;
        }

        visited.add(currentId);
        currentId = elements[currentId]?.parent?.id;
    }

    return null;
};

// An element belongs to the globals document if it is a global, or sits inside one.
export const isGlobalElement = (elements: ElementMap, id: string): boolean => {
    return getGlobalRootId(elements, id) !== null;
};

// The elements and bindings of one global and everything inside it.
export const pickGlobalElement = (document: GlobalDocument, globalId: string): GlobalDocument => {
    const result: GlobalDocument = { elements: {}, bindings: {} };

    for (const id in document.elements) {
        if (getGlobalRootId(document.elements, id) === globalId) {
            result.elements[id] = document.elements[id];
        }
    }

    for (const id in document.bindings) {
        if (result.elements[id] || id === globalId) {
            result.bindings[id] = document.bindings[id];
        }
    }

    return result;
};

// Split a document's elements and bindings into the page's own part and the globals part.
export const splitGlobalDocument = (document: GlobalDocument) => {
    const page: GlobalDocument = { elements: {}, bindings: {} };
    const globals: GlobalDocument = { elements: {}, bindings: {} };

    for (const id in document.elements) {
        const target = isGlobalElement(document.elements, id) ? globals : page;
        target.elements[id] = document.elements[id];
    }

    for (const id in document.bindings) {
        const isGlobal = document.elements[id]
            ? isGlobalElement(document.elements, id)
            : GlobalElementId.isGlobal(id);
        const target = isGlobal ? globals : page;
        target.bindings[id] = document.bindings[id];
    }

    return { page, globals };
};

// Replace one global (and everything inside it) in a document.
export const replaceGlobalElement = (
    document: GlobalDocument,
    globalId: string,
    value: GlobalDocument
): GlobalDocument => {
    const previous = pickGlobalElement(document, globalId);
    const result: GlobalDocument = {
        elements: { ...document.elements },
        bindings: { ...document.bindings }
    };

    Object.keys(previous.elements).forEach(id => delete result.elements[id]);
    Object.keys(previous.bindings).forEach(id => delete result.bindings[id]);
    Object.assign(result.elements, structuredClone(value.elements));
    Object.assign(result.bindings, structuredClone(value.bindings));

    return result;
};
