import React from "react";
import { Components } from "@webiny/app-workflows";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms";

const {
    ContentReview: { WorkflowStateTooltip }
} = Components;

const { Actions } = InternalContentEntryEditorConfig;

export const CmsEntryFormTooltipButton = () => {
    return (
        <InternalContentEntryEditorConfig>
            <Actions.ButtonAction
                before={"save"}
                name={"workflowStateTooltip"}
                element={<WorkflowStateTooltip />}
            />
        </InternalContentEntryEditorConfig>
    );
};
