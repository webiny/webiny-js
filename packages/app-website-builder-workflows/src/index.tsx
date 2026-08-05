import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { ListOpenInNewWindow, PageEditorConfig, PagesList } from "~/Components/index.js";
import { PageListWorkflowsFeature } from "~/presentation/page/PageList/feature.js";
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";

export const WebsiteBuilderWorkflows = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={PageListWorkflowsFeature} />
            <RegisterFeature feature={PageGetWorkflowsFeature} />
            <WebsiteBuilderWorkflowsMenu />
            <PageEditorConfig />
            <PagesList />
            <ListOpenInNewWindow />
        </>
    );
};
