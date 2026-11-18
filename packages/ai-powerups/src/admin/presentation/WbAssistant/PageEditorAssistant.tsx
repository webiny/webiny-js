import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "@webiny/app-website-builder";
import { useSelectFromEditor } from "@webiny/app-website-builder";
import { PageEditorAssistantFeature } from "./feature.js";
import type { PageDocument } from "./types.js";

/**
 * Connects the page editor to the assistant while the editor is open. The presenter does the work;
 * this hands it the editor and tells it when the selection changes.
 */
export const PageEditorAssistant = () => {
    const editor = useDocumentEditor<PageDocument>();
    const { presenter } = useFeature(PageEditorAssistantFeature);
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const selectedElementId = useSelectFromEditor(state => state.selectedElement);

    useEffect(() => {
        presenter.attach(editor);
        return () => presenter.detach();
    }, [editor]);

    useEffect(() => {
        presenter.syncTools();
    }, [isReadOnly]);

    useEffect(() => {
        presenter.refresh();
    }, [selectedElementId]);

    return null;
};
