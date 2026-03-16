import type { Editor } from "../Editor.js";
import type { CommandPayload } from "~/editorSdk/createCommand.js";
import type { Commands } from "~/BaseEditor/index.js";
import {
    type ConstraintResult,
    ElementFactory,
    evaluateConstraints
} from "@webiny/website-builder-sdk";
import { executeOnChange, applyAncestorUpdates } from "./executeOnChange.js";

export function $createElement(
    editor: Editor,
    payload: CommandPayload<typeof Commands.CreateElement>
): ConstraintResult | undefined {
    const { componentName, index, parentId, slot, bindings } = payload;
    const componentsManifest = editor.getEditorState().read().components;

    const result = evaluateConstraints({
        componentName,
        parentId,
        slot,
        document: editor.getDocumentState().read(),
        components: componentsManifest
    });

    if (!result.allowed) {
        return result;
    }

    const elementFactory = new ElementFactory(componentsManifest);
    const { element: newElement, operations } = elementFactory.createElementFromComponent({
        componentName,
        parentId,
        slot,
        index,
        bindings: bindings ?? componentsManifest[componentName].defaults ?? {}
    });

    editor.updateDocument(document => {
        operations.forEach(operation => operation.apply(document));
    });

    // Fire onChange on the new element + onDescendantChange on all ancestors.
    // The new element now exists in the document, so the ancestor walk works.
    const editorState = editor.getEditorState().read();
    const breakpointNames = editorState.viewport.breakpoints.map(bp => bp.name);
    const baseBreakpoint = breakpointNames[0];

    const ancestorUpdates = executeOnChange({
        editor,
        elementId: newElement.id,
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

    return;
}
