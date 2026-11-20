import type { Document } from "./types.js";

type DocumentPart = Pick<Document, "elements" | "bindings">;
type AreaElement = { id: string; component?: { name: string } };

/**
 * A page content area of a layout: where a page renders its own content. Every layout has exactly one
 * main content area, which can't be renamed, and any number of named ones. In the page editor, each area
 * is a place to drop content.
 */
export class LayoutContentArea {
    // The main page content area's component.
    static readonly MAIN_COMPONENT = "Webiny/LayoutContent";

    // A named page content area, inserted into a layout in the layout editor. Its name is its one input.
    static readonly NAMED_COMPONENT = "Webiny/NamedContent";

    // The name of the main content area. It holds the page root's `children`.
    static readonly MAIN = "main";

    // The input of a named content area holding its name: a label for people, never what content is stored by.
    static readonly NAME_INPUT = "area";

    private static readonly PAGE_ROOT_ID = "root";
    private static readonly PAGE_ROOT_CHILDREN_SLOT = "children";

    private readonly elementId: string;
    private readonly main: boolean;
    private readonly areaName: string | null;

    private constructor(elementId: string, main: boolean, areaName: string | null) {
        this.elementId = elementId;
        this.main = main;
        this.areaName = areaName;
    }

    // Whether a component is a page content area: the main one or a named one.
    static is(componentName: string | undefined): boolean {
        return (
            componentName === LayoutContentArea.MAIN_COMPONENT ||
            componentName === LayoutContentArea.NAMED_COMPONENT
        );
    }

    /**
     * The content area an element of a layout is, with the name its author gave it. `null` when the
     * element isn't a content area.
     */
    static from(document: DocumentPart, elementId: string): LayoutContentArea | null {
        const element = document.elements[elementId];
        if (!element || !LayoutContentArea.is(element.component?.name)) {
            return null;
        }

        return LayoutContentArea.fromElement(
            element,
            document.bindings[elementId]?.inputs?.[LayoutContentArea.NAME_INPUT]?.static
        );
    }

    /**
     * A content area element as it is rendered, with its name input. The main area's name is always `main`;
     * a named area without a name has none.
     */
    static fromElement(element: AreaElement, nameInput?: unknown): LayoutContentArea {
        if (element.component?.name === LayoutContentArea.MAIN_COMPONENT) {
            return new LayoutContentArea(element.id, true, LayoutContentArea.MAIN);
        }

        const name = typeof nameInput === "string" && nameInput.trim() ? nameInput.trim() : null;
        return new LayoutContentArea(element.id, false, name);
    }

    // A layout's page content areas.
    static allIn(document: DocumentPart): LayoutContentArea[] {
        return LayoutContentArea.idsIn(document).map(id => LayoutContentArea.from(document, id)!);
    }

    /**
     * Whether an element is, or holds, a page content area. Cloning such an element would give a layout a
     * second main area, or a named area pages have no content of under a copied name.
     */
    static anyWithin(document: Pick<Document, "elements">, elementId: string): boolean {
        return LayoutContentArea.holdsAny(document, elementId, LayoutContentArea.idsIn(document));
    }

    /**
     * Whether an element is, or holds, the main page content area. Deleting it would leave the layout without
     * one. Named areas can be deleted: pages keep their content of it, and show it again if Undo brings it back.
     */
    static mainWithin(document: Pick<Document, "elements">, elementId: string): boolean {
        const mainIds = Object.keys(document.elements).filter(id => {
            return document.elements[id].component?.name === LayoutContentArea.MAIN_COMPONENT;
        });
        return LayoutContentArea.holdsAny(document, elementId, mainIds);
    }

    /**
     * The input of an element a slot is checked against when content is dropped into it. The page root's
     * manifest has one slot input, `children`: its other slots hold its content of the named areas, and are
     * the same kind of slot, one per area.
     */
    static slotInputPath(parentId: string, slot: string): string {
        return parentId === LayoutContentArea.PAGE_ROOT_ID
            ? LayoutContentArea.PAGE_ROOT_CHILDREN_SLOT
            : slot;
    }

    private static idsIn(document: Pick<Document, "elements">): string[] {
        return Object.keys(document.elements).filter(id => {
            return LayoutContentArea.is(document.elements[id].component?.name);
        });
    }

    // Whether an element is, or holds, one of the given elements.
    private static holdsAny(
        document: Pick<Document, "elements">,
        elementId: string,
        ids: string[]
    ): boolean {
        return ids.some(id => {
            const visited = new Set<string>();
            let current: string | undefined = id;
            while (current && !visited.has(current)) {
                if (current === elementId) {
                    return true;
                }
                visited.add(current);
                current = document.elements[current]?.parent?.id;
            }
            return false;
        });
    }

    isMain(): boolean {
        return this.main;
    }

    /**
     * The area's name, shown to people: `main` for the main content area, and its name input for a named
     * one. A named area without a name is `null`.
     */
    name(): string | null {
        return this.areaName;
    }

    /**
     * The slot of the page root holding the page's content of the area. The main area's is `children`, so
     * pages built without areas keep their content there. A named area's is the area element's id: it never
     * changes when the area is renamed, and the layout's language versions and copies keep it.
     */
    slot(): string {
        return this.main ? LayoutContentArea.PAGE_ROOT_CHILDREN_SLOT : this.elementId;
    }
}
