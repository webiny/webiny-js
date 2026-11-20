import type { ToolPipelineRunner } from "@webiny/app-admin";
import type { ToolRegistry } from "@webiny/app-admin";
import { Editor } from "@webiny/app-website-builder";
import { $getElementInputValues } from "@webiny/app-website-builder";
import { $updateElementInputs } from "@webiny/app-website-builder";
import { describeValueTools } from "~/admin/presentation/WbAiContext/describeValueTools.js";
import type { PageEditorAccess } from "./pageEditorTools.js";
import type { PageEditor } from "./types.js";

const { Commands } = Editor;

/**
 * The page editor behind `PageEditorAccess`. Elements are created, moved and deleted with the
 * editor's commands. Inputs change through `$updateElementInputs`, the same call the sidebar makes
 * (`useUpdateElement`): there is no command for it.
 */
export const createPageEditorAccess = (
    editor: PageEditor,
    pipelineRunner: ToolPipelineRunner.Interface,
    toolRegistry: ToolRegistry.Interface
): PageEditorAccess => {
    return {
        components: () => editor.getEditorState().read().components,
        document: () => editor.getDocumentState().read(),
        createElement: async params => {
            await editor.executeCommand(Commands.CreateElement, params);
        },
        updateInputs: (elementId, inputs) => {
            $updateElementInputs(editor, elementId, current => {
                Object.assign(current, inputs);
            });
        },
        moveElement: async params => {
            await editor.executeCommand(Commands.MoveElement, params);
        },
        deleteElement: async id => {
            await editor.executeCommand(Commands.DeleteElement, { id });
        },
        readInputs: elementId => {
            const document = editor.getDocumentState().read();
            const { components } = editor.getEditorState().read();
            return $getElementInputValues(document, components, elementId, 0);
        },
        resolveValues: async value => {
            const resolved = await pipelineRunner.resolve(value);
            // The runner keeps the shape it is given: an object of inputs comes back as one.
            return resolved as Record<string, unknown>;
        },
        valueTools: () => describeValueTools(toolRegistry)
    };
};
