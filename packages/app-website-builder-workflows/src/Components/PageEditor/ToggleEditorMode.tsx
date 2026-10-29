import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowState, WorkflowStateValue } from "@webiny/app-workflows";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";

export const ToggleEditorMode = observer(() => {
    const { presenter } = useWorkflowState();
    const editor = useDocumentEditor();

    const state = presenter.vm.state?.state;

    /**
     * A page is locked for the duration of the review. Once the review is approved the page can
     * be published, so the editor has to become writable again - otherwise the top bar keeps
     * offering "New Revision" instead of "Publish".
     */
    const isUnderReview = !!state && state !== WorkflowStateValue.approved;

    useEffect(() => {
        const options = editor.getEditorOptions();
        editor.updateEditor(state => {
            state.isReadOnly = options.isReadOnly || isUnderReview;
        });
    }, [isUnderReview]);

    return null;
});
