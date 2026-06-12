import React, { useEffect } from "react";
import { useWorkflowState } from "@webiny/app-workflows";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { observer } from "mobx-react-lite";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";

const { Ui } = PageEditorConfig;

const ToggleReadonly = observer(() => {
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

export const PageEditorLayout = Ui.Layout.createDecorator(Original => {
    return function PageEditorLayoutWorkflowsState() {
        return (
            <>
                <Original />
                <ToggleReadonly />
            </>
        );
    };
});
