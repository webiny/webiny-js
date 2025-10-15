import React from "react";
import { ContentEntryFormWorkflow } from "~/Components/ContentEntryFormWorkflow.js";
import { CmsWorkflowsEditor } from "~/Views/CmsWorkflowsEditor.js";

export const CmsWorkflows = () => {
    return (
        <>
            <CmsWorkflowsEditor />
            <ContentEntryFormWorkflow />
        </>
    );
};
