import { GlobalElementId } from "~/domain/globals/GlobalElementId.js";
import { DocumentElements } from "~/domain/globals/DocumentElements.js";

type Elements = Record<string, any>;
type Bindings = Record<string, any>;

/**
 * A global component's document: its `elements` and `bindings`, rooted at its instance element
 * (`$global:{name}`).
 */
export class GlobalComponentDocument {
    readonly name: string;
    readonly elements: Elements;
    readonly bindings: Bindings;

    private constructor(name: string, elements: Elements, bindings: Bindings) {
        this.name = name;
        this.elements = elements;
        this.bindings = bindings;
    }

    /**
     * From `name`, `elements` and `bindings` as sent: they are checked by `validate()`, not here.
     */
    static from({
        name,
        elements,
        bindings
    }: {
        name?: unknown;
        elements?: unknown;
        bindings?: unknown;
    }): GlobalComponentDocument {
        return new GlobalComponentDocument(
            name as string,
            elements as Elements,
            bindings as Bindings
        );
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    /**
     * Returns the reason the document is invalid, or `null`.
     */
    validate(): string | null {
        const { name, elements, bindings } = this;
        if (typeof name !== "string" || !name) {
            return "`name` must be a non-empty string.";
        }

        if (
            !GlobalComponentDocument.isPlainObject(elements) ||
            !GlobalComponentDocument.isPlainObject(bindings)
        ) {
            return "`elements` and `bindings` must be objects.";
        }

        const elementId = GlobalElementId.fromName(name);
        if (elements[elementId.toString()]?.component?.name !== name) {
            return `\`elements\` must contain the "${elementId}" element of the "${name}" component.`;
        }

        // Stored elements are merged into every page, so anything outside this global would overwrite page elements.
        const foreignIds = DocumentElements.from(elements).foreignIdsOf(elementId, bindings);
        if (foreignIds.length) {
            return `\`elements\` and \`bindings\` may only contain "${elementId}" and the elements inside it; found ${foreignIds
                .map(id => `"${id}"`)
                .join(", ")}.`;
        }

        return null;
    }
}
