import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowState } from "@webiny/app-workflows";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";

export const ToggleEditorMode = observer(() => {
    const { presenter } = useWorkflowState();
    const editor = useDocumentEditor();

    const hasState = !!presenter.vm.state?.state;

    useEffect(() => {
        editor.updateEditor(state => {
            state.isReadOnly = hasState;
        });
    }, [hasState]);

    return null;
});
