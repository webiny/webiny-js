import { toJS } from "mobx";
import type { Editor } from "../Editor.js";
import {
    BindingsProcessor,
    ComponentManifestToAstConverter,
    ElementFactory,
    InputsBindingsProcessor
} from "@webiny/website-builder-sdk";
import { executeOnChange, applyAncestorUpdates } from "./executeOnChange.js";

/**
 * Programmatically update an element's inputs using a callback-based API.
 * The updater receives a deep object representation of the element's inputs
 * which can be mutated in place.
 */
export function $updateElementInputs(
    editor: Editor,
    elementId: string,
    updater: (inputs: Record<string, any>) => void
): void {
    const document = editor.getDocumentState().read();
    const editorState = editor.getEditorState().read();
    const components = editorState.components;

    const element = document.elements[elementId];
    if (!element) {
        return;
    }

    const manifest = components[element.component.name];
    if (!manifest) {
        return;
    }

    const breakpointNames = editorState.viewport.breakpoints.map(bp => bp.name);
    const baseBreakpoint = breakpointNames[0];
    const inputsAst = ComponentManifestToAstConverter.convert(manifest.inputs ?? []);
    const rawBindings = toJS(document.bindings[elementId]) ?? {};
    const elementFactory = new ElementFactory(components);

    const bindingsProcessor = new BindingsProcessor(breakpointNames);
    const resolvedBindings = bindingsProcessor.getBindings(rawBindings, baseBreakpoint);

    const inputsProcessor = new InputsBindingsProcessor(
        elementId,
        inputsAst,
        breakpointNames,
        rawBindings,
        elementFactory
    );

    const deepInputs = inputsProcessor.toDeepInputs(resolvedBindings.inputs);

    updater(deepInputs);

    // Run manifest.onChange + onDescendantChange on ancestors
    const ancestorUpdates = executeOnChange({
        editor,
        elementId,
        deepInputs,
        action: "update",
        breakpointNames,
        baseBreakpoint,
        elementFactory
    });

    const inputsUpdater = inputsProcessor.createUpdate(deepInputs, baseBreakpoint);

    editor.updateDocument(doc => {
        inputsUpdater.applyToDocument(doc);
        applyAncestorUpdates(doc, ancestorUpdates, breakpointNames, baseBreakpoint, elementFactory);
    });
}
