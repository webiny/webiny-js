import React from "react";
import { WorkflowStateTooltip } from "@webiny/app-workflows";
import { PageEditorConfig } from "@webiny/app-website-builder";

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
