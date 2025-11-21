import React from "react";
import { PageFormWorkflowStateTooltip } from "./PageFormWorkflowStateTooltip.js";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-security";
import { WorkflowStateProvider } from "@webiny/app-workflows";
import { WB_PAGE_APP } from "~/constants.js";
import { PageFormWorkflowState } from "./PageFormWorkflowState.js";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { PageFormWorkflowStatePublishButton } from "./PageFormWorkflowStatePublishButton.js";

const { Ui } = PageEditorConfig;

export const PageEditor = Ui.TopBar.Layout.createDecorator(Original => {
    return function PageEditorTopBarWorkflowsState() {
        const page = useSelectFromDocument(doc => {
            return {
                id: doc.id,
                title: doc.properties.title || "unknown page"
            };
        });

        const client = useApolloClient();
        const { identity } = useSecurity();

        return (
            <WorkflowStateProvider
                app={WB_PAGE_APP}
                id={page.id}
                identity={identity}
                client={client}
                title={`Website Builder: ${page.title}`}
            >
                {/* Should add a button with list of steps and their states + comment button in each row */}
                <PageFormWorkflowStateTooltip />
                {/* should remove publish button from the form */}
                <PageFormWorkflowStatePublishButton />
                {/* Original top bar*/}
                <Original />
                {/* Should render workflow state bar and the alert for storing changes */}
                <PageFormWorkflowState />
            </WorkflowStateProvider>
        );
    };
});
