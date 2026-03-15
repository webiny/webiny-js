import type { Editor } from "../Editor.js";
import type { CommandPayload } from "~/editorSdk/createCommand.js";
import type { Commands } from "~/BaseEditor/index.js";
import {
    type ConstraintResult,
    ElementFactory,
    evaluateConstraints
} from "@webiny/website-builder-sdk";

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

    console.log("input", payload);

    const elementFactory = new ElementFactory(componentsManifest);
    const { operations } = elementFactory.createElementFromComponent({
        componentName,
        parentId,
        slot,
        index,
        bindings: bindings ?? componentsManifest[componentName].defaults ?? {}
    });

    console.log("operations", operations);

    editor.updateDocument(document => {
        operations.forEach(operation => operation.apply(document));
    });

    return;
}
