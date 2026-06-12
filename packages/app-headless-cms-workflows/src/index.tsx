import React from "react";
import { RegisterFeature, Wcp } from "@webiny/app-admin";
import { CmsWorkflowsEditor } from "~/Routes/index.js";
import {
    CmsEntryFormScheduleMenuItemAction,
    CmsEntryFormTooltipButton,
    ContentEntryFormWorkflow
} from "~/Components/ContentEntryForm/index.js";
import { CmsEntriesWorkflowStateListFooterMenu } from "~/Components/CmsEntriesWorkflowStateList/index.js";
import { ListOpenInNewWindow } from "~/Components/OptionItem/OpenInNewWindow.js";
import { CmsEntryFormCreateNewRevisionButton } from "~/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.js";
import { CmsWorkflowsFeature } from "~/presentation/feature.js";

export const CmsWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <RegisterFeature feature={CmsWorkflowsFeature} />
            <ListOpenInNewWindow />
            <CmsEntriesWorkflowStateListFooterMenu />
            <CmsWorkflowsEditor />
            <ContentEntryFormWorkflow />
            <CmsEntryFormTooltipButton />
            <CmsEntryFormScheduleMenuItemAction />
            <CmsEntryFormCreateNewRevisionButton />
        </Wcp.CanUseWorkflows>
    );
};
