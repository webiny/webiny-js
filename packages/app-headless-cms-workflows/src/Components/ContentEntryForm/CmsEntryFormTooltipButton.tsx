import React from "react";
import { WorkflowStateTooltip } from "@webiny/app-workflows";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

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
