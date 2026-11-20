import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "@webiny/app-website-builder";
import { useSelectFromEditor } from "@webiny/app-website-builder";
import { PageEditorAssistantFeature } from "./feature.js";
import type { PageDocument } from "./types.js";

/**
 * Connects the page editor to the assistant while the editor is open. The connector does the work;
 * this hands it the editor and tells it when the selection changes.
 */
export const PageEditorAssistant = () => {
    const editor = useDocumentEditor<PageDocument>();
    const { connector } = useFeature(PageEditorAssistantFeature);
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const selectedElementId = useSelectFromEditor(state => state.selectedElement);

    useEffect(() => {
        connector.attach(editor);
        return () => connector.detach();
    }, [editor]);

    useEffect(() => {
        connector.syncTools();
    }, [isReadOnly]);

    useEffect(() => {
        connector.refresh();
    }, [selectedElementId]);

    return null;
};
