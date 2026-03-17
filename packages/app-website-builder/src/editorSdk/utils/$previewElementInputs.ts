import { toJS } from "mobx";
import type { Editor } from "../Editor.js";
import {
    BindingsProcessor,
    ComponentManifestToAstConverter,
    ElementFactory,
    InputsBindingsProcessor
} from "@webiny/website-builder-sdk";
import { Commands } from "~/BaseEditor/index.js";

/**
 * Programmatically update an element's inputs in the preview iframe only (via JSON patch).
 * Does NOT write to the editor document state.
 */
export function $previewElementInputs(
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

    const inputsUpdater = inputsProcessor.createUpdate(deepInputs, baseBreakpoint);
    const patch = inputsUpdater.createJsonPatch(rawBindings);

    editor.executeCommand(Commands.PreviewPatchElement, { elementId, patch });
}
