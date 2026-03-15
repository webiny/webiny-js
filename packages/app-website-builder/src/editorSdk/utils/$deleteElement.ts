import { evaluateDeleteConstraint } from "@webiny/website-builder-sdk";
import { $getElementById } from "./$getElementById.js";
import { $removeElementReferenceFromParent } from "./$removeElementReferenceFromParent.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { Commands } from "~/BaseEditor/index.js";

export function $deleteElement(editor: Editor, id: string, ignoreConstraints = false) {
    const document = editor.getDocumentState().read();
    const elementToDelete = $getElementById(document, id);

    if (!elementToDelete) {
        return;
    }

    if (!ignoreConstraints) {
        const result = evaluateDeleteConstraint({
            elementId: id,
            document,
            components: editor.getEditorState().read().components
        });

        if (!result.allowed) {
            return result;
        }
    }

    editor.executeCommand(Commands.DeselectElement);

    editor.updateDocument(document => {
        // Remove the reference to the element from its parent element.
        if (elementToDelete.parent) {
            $removeElementReferenceFromParent(document, {
                elementId: id,
                parentId: elementToDelete.parent.id,
                slot: elementToDelete.parent.slot
            });
        }

        // Remove all descendants.
        Object.values(document.elements)
            .filter(el => el.parent?.id === id)
            .forEach(element => {
                $deleteElement(editor, element.id, true);
            });

        // Delete element bindings.
        delete document.bindings[elementToDelete.id];

        // Delete the element itself.
        delete document.elements[id];
    });

    return;
}
