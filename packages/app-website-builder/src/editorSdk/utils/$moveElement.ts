import type { ComponentManifest, ConstraintResult, Document } from "@webiny/website-builder-sdk";
import {
    LayoutContentArea,
    evaluateConstraints,
    getGlobalRootId,
    isGlobalElement,
    GlobalElementId
} from "@webiny/website-builder-sdk";
import { $getElementById } from "./$getElementById.js";
import { $removeElementReferenceFromParent } from "./$removeElementReferenceFromParent.js";
import { $addElementReferenceToParent } from "./$addElementReferenceToParent.js";

interface MoveParams {
    // ID of the element to move.
    elementId: string;
    // Parent element for the new element.
    parentId: string;
    // Parent element slot (e.g., `children`, `heroBanner`, `tabsList.0.content`).
    slot: string;
    // Index within the slot.
    index: number;
    // All registered component manifests.
    components: Record<string, ComponentManifest>;
}

// Whether an element is, or holds, a placement of a global component.
const containsGlobalPlacement = (
    document: Document,
    elementId: string,
    components: Record<string, ComponentManifest>
) => {
    return Object.values(document.elements).some(element => {
        if (!GlobalElementId.isPlacement(element, components)) {
            return false;
        }

        const visited = new Set<string>();
        let current: string | undefined = element.id;
        while (current && !visited.has(current)) {
            if (current === elementId) {
                return true;
            }
            visited.add(current);
            current = document.elements[current]?.parent?.id;
        }
        return false;
    });
};

export function $moveElement(document: Document, params: MoveParams): ConstraintResult | undefined {
    const { elementId, index, slot, parentId, components } = params;

    const elementToMove = $getElementById(document, elementId);

    // Only the document's own elements move: not a global's instance (its placements do), and not the
    // elements of a page's layout.
    if (!elementToMove || GlobalElementId.isGlobal(elementId)) {
        return {
            allowed: false,
            violation: { message: "This element can't be moved here." }
        };
    }

    // An element of a global is stored with that global: moved out of it, the global's stored copy would
    // overwrite it on the page.
    const globalId = getGlobalRootId(document.elements, elementId);
    if (globalId && getGlobalRootId(document.elements, parentId) !== globalId) {
        return {
            allowed: false,
            violation: { message: "Elements of a global component can't be moved out of it." }
        };
    }

    // A global's elements are stored with the global, not the page or layout: the page content, or a
    // placement of a global, would be lost there.
    if (isGlobalElement(document.elements, parentId)) {
        if (LayoutContentArea.anyWithin(document, elementId)) {
            return {
                allowed: false,
                violation: {
                    message: "The page content can't be placed inside a global component."
                }
            };
        }

        if (containsGlobalPlacement(document, elementId, components)) {
            return {
                allowed: false,
                violation: {
                    message: "A global component can't be placed inside another global component."
                }
            };
        }
    }

    const result = evaluateConstraints({
        componentName: elementToMove.component.name,
        parentId,
        slot,
        document,
        components
    });

    if (!result.allowed) {
        return result;
    }

    // Remove the reference to the element from its parent element.
    if (elementToMove.parent) {
        $removeElementReferenceFromParent(document, {
            elementId,
            parentId: elementToMove.parent.id,
            slot: elementToMove.parent.slot
        });
    }

    // Assign new parent.
    elementToMove.parent = {
        id: parentId,
        slot
    };

    // Add reference to the new parent.
    $addElementReferenceToParent(document, {
        elementId,
        parentId,
        slot,
        index
    });

    return;
}
