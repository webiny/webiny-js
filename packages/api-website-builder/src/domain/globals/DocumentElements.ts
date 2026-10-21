import { GlobalElementId } from "./GlobalElementId.js";

type Elements = Record<string, any>;
type Bindings = Record<string, any>;

/**
 * The `elements` of a page, a layout or a global component record, as they relate to global components.
 */
export class DocumentElements<T = Elements> {
    private readonly elements: T;

    private constructor(elements: T) {
        this.elements = elements;
    }

    static from<T = Elements>(elements: T): DocumentElements<T> {
        return new DocumentElements(elements);
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    // The global component an element belongs to: its own `$global:{name}` id, or that of the global it sits inside.
    globalRootOf(id: string): GlobalElementId | null {
        const elements: Elements = DocumentElements.isPlainObject(this.elements)
            ? this.elements
            : {};
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

    /**
     * Ids in a global component's `elements` and `bindings` that are not part of that global's own tree.
     * Every stored element is merged into every page, so a stray id would overwrite page elements.
     */
    foreignIdsOf(rootId: GlobalElementId, bindings: Bindings): string[] {
        const elements: Elements = DocumentElements.isPlainObject(this.elements)
            ? this.elements
            : {};

        const foreignElements = Object.keys(elements).filter(
            id => !rootId.equals(this.globalRootOf(id))
        );
        const foreignBindings = Object.keys(bindings).filter(
            id => !elements[id] || !rootId.equals(this.globalRootOf(id))
        );

        return [...foreignElements, ...foreignBindings];
    }

    /**
     * Without the instance elements of global components, for elements about to be stored in a page or a layout:
     * every element whose id starts with `$global:`, and every element whose parent chain reaches one.
     * Instances are stored on their own, once per language. Bindings are not touched: a binding under an
     * instance element's id is the document's override of that global.
     */
    withoutGlobalInstances(): DocumentElements<T> {
        if (!DocumentElements.isPlainObject(this.elements)) {
            return this;
        }

        const result: Elements = {};
        for (const id in this.elements) {
            if (!this.globalRootOf(id)) {
                result[id] = this.elements[id];
            }
        }

        return new DocumentElements(result as T);
    }

    toJSON(): T {
        return this.elements;
    }
}
