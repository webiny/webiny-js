import React from "react";
import { Components } from "@webiny/app-workflows";
import { PageEditorConfig } from "@webiny/app-website-builder";

const {
    ContentReview: { WorkflowStateTooltip }
} = Components;

const { Ui } = PageEditorConfig;

const TooltipButton = () => {
    return <WorkflowStateTooltip />;
};

export const PageFormWorkflowStateTooltip = () => {
    return (
        <Ui.TopBar.Action
            before={"buttonPublish"}
            name={"buttonWorkflowStateTooltip"}
            element={<TooltipButton />}
        />
    );
};
