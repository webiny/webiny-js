import { HasWorkflowsEditorPermission } from "~/presentation/permissions/HasWorkflowsEditorPermission.js";
import { type IWorkflowsEditorProps, WorkflowsEditorBase } from "./WorkflowsEditorBase.js";
import React from "react";

export const WorkflowsEditor = (props: IWorkflowsEditorProps) => {
    return (
        <HasWorkflowsEditorPermission>
            <WorkflowsEditorBase {...props} />
        </HasWorkflowsEditorPermission>
    );
};
