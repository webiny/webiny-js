import React from "react";
import { Wcp } from "@webiny/app-admin";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { ListOpenInNewWindow, PageEditor, PageList } from "~/Components/index.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <WebsiteBuilderWorkflowsMenu />
            <PageEditor />
            <PageList />
            <ListOpenInNewWindow />
        </Wcp.CanUseWorkflows>
    );
};
