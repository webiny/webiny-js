import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { WorkflowStateTooltip } from "@webiny/app-workflows";

const { Actions } = ContentEntryEditorConfig;

export const CmsEntryFormTooltipButton = () => {
    return (
        <ContentEntryEditorConfig>
            <Actions.ButtonAction
                before={"save"}
                name={"workflowStateTooltip"}
                element={<WorkflowStateTooltip />}
            />
        </ContentEntryEditorConfig>
    );
};
