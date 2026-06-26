import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowState } from "@webiny/app-workflows";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";

export const ToggleEditorMode = observer(() => {
    const { presenter } = useWorkflowState();
    const editor = useDocumentEditor();

    const hasState = presenter.vm.hasState;

    useEffect(() => {
        const options = editor.getEditorOptions();
        editor.updateEditor(state => {
            state.isReadOnly = options.isReadOnly || hasState;
        });
    }, [hasState]);

    return null;
});
