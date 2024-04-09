import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import PublishingWorkflowsDataList from "./PublishingWorkflowsDataList";
import PublishingWorkflowForm from "./PublishingWorkflowForm";

export const PublishingWorkflowsView = () => {
    return (
        <SplitView>
            <LeftPanel>
                <PublishingWorkflowsDataList />
            </LeftPanel>
            <RightPanel>
                <PublishingWorkflowForm />
            </RightPanel>
        </SplitView>
    );
};
