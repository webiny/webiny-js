import type { ComponentManifest, ConstraintResult, Document } from "@webiny/website-builder-sdk";
import { evaluateConstraints } from "@webiny/website-builder-sdk";
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

export function $moveElement(document: Document, params: MoveParams): ConstraintResult | undefined {
    const { elementId, index, slot, parentId, components } = params;

    const elementToMove = $getElementById(document, elementId);

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
