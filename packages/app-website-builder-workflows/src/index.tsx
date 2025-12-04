import React from "react";
import { RegisterFeature, Wcp } from "@webiny/app-admin";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { ListOpenInNewWindow, PageEditorConfig, PagesList } from "~/Components/index.js";
import { PageListWorkflowsFeature } from "~/presentation/page/PageList/feature.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <RegisterFeature feature={PageListWorkflowsFeature} />
            <WebsiteBuilderWorkflowsMenu />
            <PageEditorConfig />
            <PagesList />
            <ListOpenInNewWindow />
        </Wcp.CanUseWorkflows>
    );
};
