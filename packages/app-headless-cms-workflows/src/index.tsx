import React from "react";
import { Wcp } from "@webiny/app-admin";
import { CmsWorkflowsEditor } from "~/Routes/index.js";
import {
    CmsEntryFormSaveAndPublishButton,
    CmsEntryFormSaveButton,
    CmsEntryFormScheduleMenuItemAction,
    CmsEntryFormTooltipButton,
    ContentEntryFormWorkflow,
    ContentEntryWorkflow
} from "~/Components/ContentEntryForm/index.js";
import { CmsEntriesWorkflowStateListFooterMenu } from "~/Components/CmsEntriesWorkflowStateList/index.js";
import { ListOpenInNewWindow } from "~/Components/OptionItem/OpenInNewWindow.js";
import { CmsEntryFormCreateNewRevisionButton } from "~/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.js";

export const CmsWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <ListOpenInNewWindow />
            {/*<CmsEntriesWorkflowStateListFooterMenu />*/}
            <CmsWorkflowsEditor />
            <ContentEntryFormWorkflow />
            <ContentEntryWorkflow />
            <CmsEntryFormTooltipButton />
            <CmsEntryFormScheduleMenuItemAction />
            <CmsEntryFormSaveAndPublishButton />
            <CmsEntryFormSaveButton />
            <CmsEntryFormCreateNewRevisionButton />
        </Wcp.CanUseWorkflows>
    );
};
