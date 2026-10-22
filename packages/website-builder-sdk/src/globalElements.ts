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

    /**
     * The global an element belongs to: the global itself, or the global it sits inside, found through the
     * element's parent chain. An id without an element (e.g. of a binding) belongs to a global only when it
     * is that global's id.
     */
    static rootOf(elements: ElementMap, id: string): GlobalElementId | null {
        const visited = new Set<string>();
        let currentId: string | undefined = id;

        while (currentId && !visited.has(currentId)) {
            const globalId = GlobalElementId.fromId(currentId);
            if (globalId) {
                return globalId;
            }

            visited.add(currentId);
            currentId = elements[currentId]?.parent?.id;
        }

        return null;
    }

    // An element (or binding) belongs to the globals document if it is a global, or sits inside one.
    static isInGlobal(elements: ElementMap, id: string): boolean {
        return GlobalElementId.rootOf(elements, id) !== null;
    }

    // Split a document's elements and bindings into the document's own part and the globals part.
    static splitDocument(document: GlobalDocument): { page: GlobalDocument; globals: GlobalDocument } {
        const page: GlobalDocument = { elements: {}, bindings: {} };
        const globals: GlobalDocument = { elements: {}, bindings: {} };

        for (const id in document.elements) {
            const target = GlobalElementId.isInGlobal(document.elements, id) ? globals : page;
            target.elements[id] = document.elements[id];
        }

        for (const id in document.bindings) {
            const target = GlobalElementId.isInGlobal(document.elements, id) ? globals : page;
            target.bindings[id] = document.bindings[id];
        }

        return { page, globals };
    }

    // The name of the global component this id stands for.
    get name(): string {
        return this.id.slice(GlobalElementId.PREFIX.length);
    }

    equals(other: GlobalElementId | null | undefined): boolean {
        return !!other && other.id === this.id;
    }

    // Whether an element (or binding) is this global, or sits inside it.
    owns(elements: ElementMap, id: string): boolean {
        return this.equals(GlobalElementId.rootOf(elements, id));
    }

    toString(): string {
        return this.id;
    }
}
