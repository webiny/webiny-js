import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { AssistantComposerControlsFeature } from "@webiny/app-admin";
import { useDocumentEditor } from "@webiny/app-website-builder";
import { useSelectFromEditor } from "@webiny/app-website-builder";
import { PageEditorAssistantFeature } from "./feature.js";
import { PromptContextFeature } from "./promptContextFeature.js";
import { PromptContextChips } from "./PromptContextChips.js";
import type { PageDocument } from "./types.js";

/** The name the server reads the project and persona choice under. */
const PROMPT_CONTEXT_CONTROL = "promptContext";

/**
 * Connects the page editor to the assistant while the editor is open. The connector does the work;
 * this hands it the editor and tells it when the selection changes. It also puts the project and
 * persona pickers under the assistant's question box, for as long as the editor is open.
 */
export const PageEditorAssistant = () => {
    const editor = useDocumentEditor<PageDocument>();
    const { connector } = useFeature(PageEditorAssistantFeature);
    const { promptContext } = useFeature(PromptContextFeature);
    const { composerControls } = useFeature(AssistantComposerControlsFeature);
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const selectedElementId = useSelectFromEditor(state => state.selectedElement);

    useEffect(() => {
        connector.attach(editor);
        return () => connector.detach();
    }, [editor]);

    useEffect(() => {
        const owner = composerControls.register([
            {
                name: PROMPT_CONTEXT_CONTROL,
                element: <PromptContextChips />,
                value: () => promptContext.value()
            }
        ]);
        return () => composerControls.unregister(owner);
    }, []);

    useEffect(() => {
        connector.syncTools();
    }, [isReadOnly]);

    useEffect(() => {
        connector.refresh();
    }, [selectedElementId]);

    return null;
};
