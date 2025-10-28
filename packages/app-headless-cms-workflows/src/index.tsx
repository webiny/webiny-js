import React from "react";
import { Wcp } from "@webiny/app-admin";
import { ContentEntryFormWorkflow } from "~/Components/ContentEntryFormWorkflow.js";
import { CmsWorkflowsEditor } from "~/Routes/CmsWorkflowsEditor.js";
import { CmsEntryFormTooltipButton } from "~/Components/CmsEntryFormTooltipButton.js";
import { ContentEntryWorkflow } from "~/Components/ContentEntryWorkflow.js";
import { CmsEntryFormSaveAndPublishButton } from "~/Components/CmsEntryFormSaveAndPublishButton.js";
import { CmsEntryFormScheduleMenuItemAction } from "~/Components/CmsEntryFormScheduleMenuItemAction.js";
import { CmsEntryFormSaveButton } from "~/Components/CmsEntryFormSaveButton.js";

export const CmsWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <CmsWorkflowsEditor />
            <ContentEntryFormWorkflow />
            <ContentEntryWorkflow />
            <CmsEntryFormTooltipButton />
            <CmsEntryFormScheduleMenuItemAction />
            <CmsEntryFormSaveAndPublishButton />
            <CmsEntryFormSaveButton />
        </Wcp.CanUseWorkflows>
    );
};
