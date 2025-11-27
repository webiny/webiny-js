import React from "react";
import { Components } from "@webiny/app-workflows";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

const {
    ContentReview: { WorkflowStateTooltip }
} = Components;

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
