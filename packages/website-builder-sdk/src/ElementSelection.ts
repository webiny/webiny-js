import { makeAutoObservable } from "mobx";
import type { Document } from "~/types.js";
import { GlobalElementId } from "./globalElements.js";

/**
 * The element selected in the editor, as told to the preview by the `element.selected` and
 * `element.deselected` messages. Overlays are drawn by the editor, so without this the preview
 * can't know what is selected. Outside the editor nothing is ever selected.
 */
export class ElementSelection {
    private selectedId: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    getSelectedId() {
        return this.selectedId;
    }

    select(id: string | null) {
        this.selectedId = id;
    }

    deselect() {
        this.selectedId = null;
    }

    /**
     * Whether the element, or an element inside it, is selected.
     * The document is used to walk up from the selected element through its parents. A global's instance
     * (`$global:{name}`) is selected when one of its placements is, or an element inside one; a placement
     * may also belong to the page's layout.
     */
    isSelected(id: string, document: Pick<Document, "elements" | "layout"> | null) {
        const visited = new Set<string>();
        let currentId = this.selectedId;
        while (currentId && !visited.has(currentId)) {
            if (currentId === id) {
                return true;
            }
            visited.add(currentId);

            const element =
                document?.elements[currentId] ?? document?.layout?.elements?.[currentId];
            if (
                element?.component &&
                GlobalElementId.fromName(element.component.name).toString() === id
            ) {
                return true;
            }
            currentId = element?.parent?.id ?? null;
        }
        return false;
    }
}
