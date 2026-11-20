import { GlobalElementId } from "~/domain/globals/GlobalElementId.js";

type Elements = Record<string, any>;
type Bindings = Record<string, any>;

/**
 * A layout's document: its `elements` and `bindings`.
 */
export class LayoutDocument {
    // The main page content area: where a page renders its own content inside a layout. It can't be renamed.
    static readonly CONTENT_COMPONENT = "Webiny/LayoutContent";

    private static readonly CONTENT_ELEMENT_ID = "layout-content";

    readonly elements: Elements;
    readonly bindings: Bindings;

    private constructor(elements: Elements, bindings: Bindings) {
        this.elements = elements;
        this.bindings = bindings;
    }

    /**
     * From `elements` and `bindings` as sent: they are checked by `validate()`, not here.
     */
    static from({
        elements,
        bindings
    }: {
        elements?: unknown;
        bindings?: unknown;
    }): LayoutDocument {
        return new LayoutDocument(elements as Elements, bindings as Bindings);
    }

    /**
     * A layout as stored. One stored without its document (e.g., before layouts had one) opens as a new layout
     * does, so the editor always gets a root and the page content placeholder.
     */
    static fromStored(elements: unknown, bindings: unknown): LayoutDocument {
        if (
            !LayoutDocument.isPlainObject(elements) ||
            !LayoutDocument.isPlainObject(elements.root)
        ) {
            return LayoutDocument.createDefault();
        }

        return LayoutDocument.from({ elements, bindings: bindings ?? {} }).withGlobalPlacements();
    }

    /**
     * A new layout starts with the page content placeholder already in it, so content can't be forgotten:
     * everything else is added around it.
     */
    static createDefault(): LayoutDocument {
        const contentId = LayoutDocument.CONTENT_ELEMENT_ID;

        return new LayoutDocument(
            {
                root: {
                    type: "Webiny/Element",
                    id: "root",
                    component: { name: "Webiny/Root" }
                },
                [contentId]: {
                    type: "Webiny/Element",
                    id: contentId,
                    component: { name: LayoutDocument.CONTENT_COMPONENT },
                    parent: { id: "root", slot: "children" }
                }
            },
            {
                root: {
                    inputs: {
                        children: {
                            type: "slot",
                            list: true,
                            static: [contentId]
                        }
                    }
                }
            }
        );
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    /**
     * Layouts saved before global components had placements reference a global's instance
     * (`$global:{name}`) right in a slot. Each such reference becomes a placement of that global: an element
     * of the layout's own tree, like every other element, so it can be moved and deleted in the layout editor.
     * Placement ids follow from the stored layout, so a page's overrides of them stay attached until the
     * layout is saved with them.
     */
    withGlobalPlacements(): LayoutDocument {
        const elements: Elements = { ...this.elements };
        const bindings: Bindings = { ...this.bindings };
        const counts: Record<string, number> = {};

        const toPlacement = (parentId: string, slot: string, id: unknown) => {
            const globalId = GlobalElementId.fromId(id);
            if (!globalId) {
                return id;
            }

            const name = globalId.name;
            // Names that sanitize alike share a counter, and an id already in the layout is skipped,
            // so no placement overwrites another element.
            const base = `placement-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;
            let placementId: string;
            do {
                counts[base] = (counts[base] ?? 0) + 1;
                placementId = `${base}-${counts[base]}`;
            } while (elements[placementId]);

            elements[placementId] = {
                type: "Webiny/Element",
                id: placementId,
                component: { name },
                parent: { id: parentId, slot }
            };

            return placementId;
        };

        for (const parentId of Object.keys(this.elements)) {
            const inputs = this.bindings[parentId]?.inputs;
            if (!LayoutDocument.isPlainObject(inputs)) {
                continue;
            }

            let changed = false;
            const nextInputs: Bindings = { ...inputs };
            for (const slot of Object.keys(inputs)) {
                const input = inputs[slot];
                if (!LayoutDocument.isPlainObject(input) || input.type !== "slot") {
                    continue;
                }

                const value = Array.isArray(input.static)
                    ? input.static.map((id: unknown) => toPlacement(parentId, slot, id))
                    : toPlacement(parentId, slot, input.static);

                if (JSON.stringify(value) !== JSON.stringify(input.static)) {
                    nextInputs[slot] = { ...input, static: value };
                    changed = true;
                }
            }

            if (changed) {
                bindings[parentId] = { ...bindings[parentId], inputs: nextInputs };
            }
        }

        return new LayoutDocument(elements, bindings);
    }

    /**
     * Validate the document as it is stored: global instance elements are already removed from it.
     * Returns the reason it is invalid, or `null`.
     */
    validate(): string | null {
        const { elements, bindings } = this;
        if (!LayoutDocument.isPlainObject(elements) || !LayoutDocument.isPlainObject(bindings)) {
            return "`elements` and `bindings` must be objects.";
        }

        const invalidId = Object.keys(elements).find(
            id => !LayoutDocument.isPlainObject(elements[id])
        );
        if (invalidId) {
            return `Element "${invalidId}" must be an object.`;
        }

        if (!elements.root) {
            return "`elements` must contain the `root` element.";
        }

        const ids = Object.keys(elements);
        const mainCount = ids.filter(
            id => elements[id].component?.name === LayoutDocument.CONTENT_COMPONENT
        ).length;
        if (mainCount !== 1) {
            return `\`elements\` must contain exactly one main content ("${LayoutDocument.CONTENT_COMPONENT}") element.`;
        }

        // Named content areas need no checks: a name is only a label, and pages store their content of an
        // area by the area's element id.
        return null;
    }
}
