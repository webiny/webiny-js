import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { PageEditorConfig } from "@webiny/app-website-builder";
import {
    type EditorDocument,
    useSelectFromDocument
} from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { useAuthentication } from "@webiny/app-admin";
import { WorkflowStateProvider } from "@webiny/app-workflows/Components/WorkflowState/index.js";
import { WB_PAGE_APP } from "~/constants.js";
import { PageFormWorkflowState } from "~/Components/PageEditor/PageFormWorkflowState.js";
import { ToggleEditorMode } from "~/Components/PageEditor/ToggleEditorMode.js";
import { WbPageStatus, type WbStatus } from "@webiny/app-website-builder/constants.js";

const { Ui } = PageEditorConfig;

interface PageEditorTopBarEditorDocument extends EditorDocument {
    status: WbStatus;
}

interface ISelectedPage {
    id: string;
    title: string;
    status: WbStatus;
}

export const PageEditorTopBar = Ui.TopBar.Layout.createDecorator(Original => {
    return function PageEditorTopBarWorkflowsState() {
        const page = useSelectFromDocument<ISelectedPage, PageEditorTopBarEditorDocument>(doc => {
            return {
                id: doc.id,
                title: doc.properties.title || "unknown page",
                status: doc.status || "draft"
            };
        });

        const client = useApolloClient();
        const { identity } = useAuthentication();

        return (
            <WorkflowStateProvider
                app={WB_PAGE_APP}
                id={page.id}
                disabled={page.status !== WbPageStatus.Draft}
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
