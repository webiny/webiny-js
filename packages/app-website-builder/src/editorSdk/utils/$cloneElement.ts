import { generateElementId } from "@webiny/website-builder-sdk";
import type {
    Document,
    DocumentElement,
    DocumentElementBindings
} from "@webiny/website-builder-sdk";
import { ElementFactory } from "@webiny/website-builder-sdk";
import type { Editor } from "../Editor.js";
import { $getElementById } from "./$getElementById.js";
import { $addElementReferenceToParent } from "./$addElementReferenceToParent.js";
import { executeOnChange, applyAncestorUpdates } from "./executeOnChange.js";

function collectDescendants(document: Document, elementId: string): string[] {
    const ids: string[] = [];
    const bindings = document.bindings[elementId];
    if (!bindings?.inputs) {
        return ids;
    }

    for (const binding of Object.values(bindings.inputs)) {
        if (binding.type !== "slot") {
            continue;
        }

        const children = binding.list
            ? ((binding.static as string[] | undefined) ?? [])
            : binding.static
              ? [binding.static as string]
              : [];

        for (const childId of children) {
            ids.push(childId);
            ids.push(...collectDescendants(document, childId));
        }
    }

    return ids;
}

function remapBindings(
    bindings: DocumentElementBindings,
    idMap: Map<string, string>
): DocumentElementBindings {
    const cloned = structuredClone(bindings);

    if (cloned.inputs) {
        for (const [key, binding] of Object.entries(cloned.inputs)) {
            if (binding.type !== "slot") {
                continue;
            }

            if (binding.list && Array.isArray(binding.static)) {
                cloned.inputs[key] = {
                    ...binding,
                    static: binding.static.map((id: string) => idMap.get(id) ?? id)
                };
            } else if (typeof binding.static === "string") {
                const newId = idMap.get(binding.static);
                if (newId) {
                    cloned.inputs[key] = { ...binding, static: newId };
                }
            }
        }
    }

    return cloned;
}

function getSlotIndex(document: Document, element: DocumentElement): number {
    const parent = element.parent;
    if (!parent) {
        return -1;
    }

    const parentBindings = document.bindings[parent.id];
    if (!parentBindings?.inputs) {
        return -1;
    }

    const slotBinding = parentBindings.inputs[parent.slot];
    if (!slotBinding) {
        return -1;
    }

    if (slotBinding.list && Array.isArray(slotBinding.static)) {
        return slotBinding.static.indexOf(element.id);
    }

    return -1;
}

export function $cloneElement(editor: Editor, id: string): string | undefined {
    const document = editor.getDocumentState().read();
    const element = $getElementById(document, id);

    if (!element || !element.parent) {
        return undefined;
    }

    const allIds = [id, ...collectDescendants(document, id)];
    const idMap = new Map<string, string>();
    for (const oldId of allIds) {
        idMap.set(oldId, generateElementId());
    }

    const originalIndex = getSlotIndex(document, element);

    editor.updateDocument(doc => {
        for (const oldId of allIds) {
            const original = doc.elements[oldId];
            const newId = idMap.get(oldId)!;

            const clonedElement: DocumentElement = {
                ...structuredClone(original),
                id: newId
            };

            if (clonedElement.parent) {
                const newParentId = idMap.get(clonedElement.parent.id);
                if (newParentId) {
                    clonedElement.parent = {
                        ...clonedElement.parent,
                        id: newParentId
                    };
                }
            }

            doc.elements[newId] = clonedElement;

            const originalBindings = doc.bindings[oldId];
            if (originalBindings) {
                doc.bindings[newId] = remapBindings(originalBindings, idMap);
            }
        }

        const rootNewId = idMap.get(id)!;
        const insertIndex = originalIndex >= 0 ? originalIndex + 1 : originalIndex;

        $addElementReferenceToParent(doc, {
            elementId: rootNewId,
            parentId: element.parent!.id,
            slot: element.parent!.slot,
            index: insertIndex
        });
    });

    const componentsManifest = editor.getEditorState().read().components;
    const editorState = editor.getEditorState().read();
    const breakpointNames = editorState.viewport.breakpoints.map(bp => bp.name);
    const baseBreakpoint = breakpointNames[0];
    const elementFactory = new ElementFactory(componentsManifest);

    for (const oldId of allIds) {
        const newId = idMap.get(oldId)!;
        const ancestorUpdates = executeOnChange({
            editor,
            elementId: newId,
            action: "create",
            breakpointNames,
            baseBreakpoint,
            elementFactory
        });

        if (ancestorUpdates.length > 0) {
            editor.updateDocument(doc => {
                applyAncestorUpdates(
                    doc,
                    ancestorUpdates,
                    breakpointNames,
                    baseBreakpoint,
                    elementFactory
                );
            });
        }
    }

    return idMap.get(id);
}
