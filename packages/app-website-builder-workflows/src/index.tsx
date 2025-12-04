import React from "react";
import { Wcp } from "@webiny/app-admin";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { ListOpenInNewWindow, PageEditorConfig, PagesList } from "~/Components/index.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <WebsiteBuilderWorkflowsMenu />
            <PageEditorConfig />
            <PagesList />
            <ListOpenInNewWindow />
        </Wcp.CanUseWorkflows>
    );
};
