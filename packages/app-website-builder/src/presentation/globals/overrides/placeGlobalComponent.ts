import { toJS } from "mobx";
import {
    type ConstraintResult,
    evaluateConstraints,
    generateElementId,
    isGlobalElement
} from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";
import type { CommandPayload } from "~/editorSdk/createCommand.js";
import type { Commands } from "~/BaseEditor/index.js";
import { $addElementReferenceToParent } from "~/editorSdk/utils/index.js";

/**
 * Place a global component where it's dropped: a placement, an element of its own that shows the global's
 * one instance. A global can be placed any number of times.
 */
export const placeGlobalComponent = (
    editor: Editor,
    payload: CommandPayload<typeof Commands.CreateElement>
): ConstraintResult => {
    const { componentName, parentId, slot } = payload;
    const components = toJS(editor.getEditorState().read().components);
    const document = editor.getDocumentState().read();

    // Only into the document's own elements: not into the elements of a page's layout.
    if (!document.elements[parentId]) {
        return {
            allowed: false,
            violation: { message: "A global component can't be placed here." }
        };
    }

    // A global's elements are stored with the global: a placement there would be lost, or show itself.
    if (isGlobalElement(document.elements, parentId)) {
        return {
            allowed: false,
            violation: {
                message: "A global component can't be placed inside a global component."
            }
        };
    }

    const result = evaluateConstraints({ componentName, parentId, slot, document, components });
    if (!result.allowed) {
        return result;
    }

    const id = generateElementId();
    const slotValue = document.bindings[parentId]?.inputs?.[slot]?.static;
    const index = payload.index ?? (Array.isArray(slotValue) ? slotValue.length : 0);

    editor.updateDocument(document => {
        document.elements[id] = {
            type: "Webiny/Element",
            id,
            component: { name: componentName },
            parent: { id: parentId, slot }
        };
        $addElementReferenceToParent(document, { elementId: id, parentId, slot, index });
    });

    return result;
};
