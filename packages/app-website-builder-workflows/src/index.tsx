import React from "react";
import { RegisterFeature, Wcp } from "@webiny/app-admin";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { ListOpenInNewWindow, PageEditorConfig, PagesList } from "~/Components/index.js";
import { PageListWorkflowsFeature } from "~/presentation/page/PageList/feature.js";
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <RegisterFeature feature={PageListWorkflowsFeature} />
            <RegisterFeature feature={PageGetWorkflowsFeature} />
            <WebsiteBuilderWorkflowsMenu />
            <PageEditorConfig />
            <PagesList />
            <ListOpenInNewWindow />
        </Wcp.CanUseWorkflows>
    );
};
