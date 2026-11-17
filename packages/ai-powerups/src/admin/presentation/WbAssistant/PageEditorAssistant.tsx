import { useEffect, useRef } from "react";
import { z } from "zod";
import pick from "lodash/pick.js";
import { useFeature } from "@webiny/app";
import type { AssistantPageContext } from "@webiny/app-admin";
import type { Document } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";
import { useSelectFromEditor } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.js";
import { Commands } from "@webiny/app-website-builder/BaseEditor/commands.js";
import { $getElementInputValues } from "@webiny/app-website-builder/editorSdk/utils/$getElementInputValues.js";
import { $updateElementInputs } from "@webiny/app-website-builder/editorSdk/utils/$updateElementInputs.js";
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { PageEditorAssistantFeature } from "./feature.js";
import { createPageEditorTools } from "./pageEditorTools.js";
import type { PageEditorAccess } from "./pageEditorTools.js";
import { outlineLines, pageOutline } from "./pageOutline.js";

interface PageProperties {
    title?: string;
    path?: string;
}

type PageDocument = Document & { status?: string };

const describePage = (
    editor: Editor<PageDocument>,
    selectedElementId: string | null
): AssistantPageContext.Data => {
    const page = editor.getDocumentState().read();
    const { title = "Untitled", path = "" } = (page.properties ?? {}) as PageProperties;
    const { elements, truncated } = pageOutline(page);

    const details: Record<string, unknown> = {
        pageId: page.id,
        title,
        path,
        outline: outlineLines(elements),
        tools: "Change this page with the page editor tools (addPageElements and the rest). Call listPageComponents before the first change. Changes show on the canvas and are saved when the user saves the page."
    };
    if (page.status) {
        details["status"] = page.status;
    }
    if (truncated) {
        details["outlineTruncated"] = true;
    }
    if (selectedElementId && page.elements[selectedElementId]) {
        details["selectedElementId"] = selectedElementId;
    }

    return { view: `The Website Builder page editor, editing the page "${title}"`, details };
};

/**
 * Connects the page editor to the assistant while the editor is open: the page as the assistant is
 * told of it with every question, and the tools that change it, run here against the editor.
 */
export const PageEditorAssistant = () => {
    const editor = useDocumentEditor<PageDocument>();
    const { clientTools, pageContext, pipelineRunner, toolRegistry } = useFeature(
        PageEditorAssistantFeature
    );
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const selectedElementId = useSelectFromEditor(state => state.selectedElement);
    const owner = useRef<AssistantPageContext.Owner | null>(null);
    const selected = useRef(selectedElementId);
    selected.current = selectedElementId;

    useEffect(() => {
        const context = pageContext.set(describePage(editor, selected.current));
        owner.current = context;
        const unsubscribe = editor.onDocumentStateChange(() => {
            pageContext.update(context, describePage(editor, selected.current));
        });

        return () => {
            unsubscribe();
            pageContext.clear(context);
            owner.current = null;
        };
    }, [editor]);

    useEffect(() => {
        if (owner.current) {
            pageContext.update(owner.current, describePage(editor, selectedElementId));
        }
    }, [selectedElementId]);

    useEffect(() => {
        // A read-only editor shows a page that can't change, so it offers no tools to change it.
        if (isReadOnly) {
            return;
        }

        const access: PageEditorAccess = {
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
            resolveValues: value => pipelineRunner.resolve(value),
            valueTools: () => {
                return toolRegistry.getTools().map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: pick(z.toJSONSchema(tool.inputSchema), ["properties", "type"])
                }));
            }
        };

        const tools = clientTools.register(createPageEditorTools(access));
        return () => clientTools.unregister(tools);
    }, [editor, isReadOnly]);

    return null;
};
