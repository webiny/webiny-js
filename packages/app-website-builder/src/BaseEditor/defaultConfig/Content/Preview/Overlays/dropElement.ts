import type { SlotInput } from "@webiny/website-builder-sdk";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { findMatchingAstNode, LayoutContentArea } from "@webiny/website-builder-sdk";
import { Commands } from "~/BaseEditor/index.js";
import type { Editor } from "~/editorSdk/Editor.js";
import type { DropEvent } from "../useProximityDropzone.js";

const canDropComponentIntoTarget = (
    editor: Editor,
    componentName: string,
    target: DropEvent["target"]
) => {
    // Determine component manifest from drop target.
    const document = editor.getDocumentState().read();
    const parent = document.elements[target.parentId];
    if (!parent || !target.slot) {
        return false;
    }
    const componentManifest = editor.getEditorState().read().components[parent.component.name];
    if (!componentManifest) {
        return false;
    }

    // Find target input using AST.
    const inputsAst = ComponentManifestToAstConverter.convert(componentManifest.inputs ?? []);
    const targetInputNode = findMatchingAstNode(
        LayoutContentArea.slotInputPath(target.parentId, target.slot),
        inputsAst
    );

    let canAcceptComponent = targetInputNode !== undefined;
    if (targetInputNode) {
        const slotInput = targetInputNode.input as SlotInput;
        const whitelistedComponents = slotInput.components;
        if (whitelistedComponents && whitelistedComponents.length > 0) {
            canAcceptComponent = whitelistedComponents.includes(componentName);
        }
    }
    return canAcceptComponent;
};

/**
 * A drop on the canvas: moves the dragged element, or creates the dragged component (with the
 * item's bindings, if it carries any) at the drop target.
 */
export const dropElement = (editor: Editor, { item, target }: DropEvent) => {
    if (!canDropComponentIntoTarget(editor, item.componentName, target)) {
        return;
    }

    if (item.id) {
        // We're moving an existing element.
        editor.executeCommand(Commands.MoveElement, {
            elementId: item.id,
            parentId: target.parentId,
            slot: target.slot,
            index: target.index
        });
    } else {
        // We're creating a new element.
        editor.executeCommand(Commands.CreateElement, {
            componentName: item.componentName,
            parentId: target.parentId,
            slot: target.slot,
            index: target.index,
            // A dragged item may carry the new element's bindings (an insert pane's preset).
            bindings: item.bindings
        });
    }
};
