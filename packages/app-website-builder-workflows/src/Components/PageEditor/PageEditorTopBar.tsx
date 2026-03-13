import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { useAuthentication } from "@webiny/app-admin";
import { WorkflowStateProvider } from "@webiny/app-workflows/Components/WorkflowState/index.js";
import { WB_PAGE_APP } from "~/constants.js";
import { PageFormWorkflowState } from "~/Components/PageEditor/PageFormWorkflowState.js";
import { ToggleEditorMode } from "~/Components/PageEditor/ToggleEditorMode.js";

const { Ui } = PageEditorConfig;

export const PageEditorTopBar = Ui.TopBar.Layout.createDecorator(Original => {
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
                <ToggleEditorMode />
                <PageFormWorkflowState />
            </WorkflowStateProvider>
        );
    };
});
