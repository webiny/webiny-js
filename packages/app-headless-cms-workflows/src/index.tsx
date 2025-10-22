import React from "react";
import { ContentEntryFormWorkflow } from "~/Components/ContentEntryFormWorkflow.js";
import { CmsWorkflowsEditor } from "~/Views/CmsWorkflowsEditor.js";
import { Wcp } from "@webiny/app-admin";

export const CmsWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <CmsWorkflowsEditor />
            <ContentEntryFormWorkflow />
        </Wcp.CanUseWorkflows>
    );
};
