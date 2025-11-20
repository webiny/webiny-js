import React from "react";
import { PageWorkflowsEditor } from "~/Routes/index.js";
import { Wcp } from "@webiny/app-admin";
import { WorkflowsPageEditorConfig } from "~/Components/PageEditorConfig/index.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <PageWorkflowsEditor />
            <WorkflowsPageEditorConfig />
        </Wcp.CanUseWorkflows>
    );
};
