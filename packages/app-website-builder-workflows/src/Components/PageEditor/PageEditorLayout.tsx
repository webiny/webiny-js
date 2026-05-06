import React, { useEffect } from "react";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { useApolloClient } from "@apollo/react-hooks";
import { useAuthentication } from "@webiny/app-admin";
import { Components, useWorkflowState } from "@webiny/app-workflows";
import { WB_PAGE_APP } from "~/constants.js";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { observer } from "mobx-react-lite";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";

const { Ui } = PageEditorConfig;

const {
    ContentReview: { WorkflowStateProvider }
} = Components;

const ToggleReadonly = observer(() => {
    const { presenter } = useWorkflowState();
    const editor = useDocumentEditor();

    const hasState = !!presenter.vm.state?.state;

    useEffect(() => {
        const options = editor.getEditorOptions();
        editor.updateEditor(state => {
            state.isReadOnly = options.isReadOnly || hasState;
        });
    }, [hasState]);

    return null;
});

export const PageEditorLayout = Ui.Layout.createDecorator(Original => {
    return function PageEditorTopBarWorkflowsState() {
        const page = useSelectFromDocument(doc => {
            return {
                id: doc.id,
                title: doc.properties.title || "unknown page"
            };
        });

        const client = useApolloClient();
        const { identity } = useAuthentication();

        return (
            <WorkflowStateProvider
                app={WB_PAGE_APP}
                id={page.id}
                identity={identity}
                client={client}
                title={`Website Builder: ${page.title}`}
            >
                <Original />
                <ToggleReadonly />
            </WorkflowStateProvider>
        );
    };
});
