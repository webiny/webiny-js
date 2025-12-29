import React from "react";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-admin";
import { Components } from "@webiny/app-workflows";
import { WB_PAGE_APP } from "~/constants.js";
import { PageFormWorkflowState } from "./PageFormWorkflowState.js";
import { PageEditorConfig } from "@webiny/app-website-builder";

const { Ui } = PageEditorConfig;

const {
    ContentReview: { WorkflowStateProvider }
} = Components;

export const PageEditorLayout = Ui.TopBar.Layout.createDecorator(Original => {
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
                {/* Original top bar*/}
                <Original />
                {/* Should render workflow state bar and the alert for storing changes */}
                <PageFormWorkflowState />
            </WorkflowStateProvider>
        );
    };
});
