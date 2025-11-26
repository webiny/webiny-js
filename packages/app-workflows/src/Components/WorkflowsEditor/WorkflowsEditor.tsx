import { HasWorkflowsSecurityPermission } from "../WorkflowsPermissions/HasWorkflowsSecurityPermission.js";
import { type IWorkflowsEditorProps, WorkflowsEditorBase } from "./WorkflowsEditorBase.js";
import React from "react";

export const WorkflowsEditor = (props: IWorkflowsEditorProps) => {
    return (
        <HasWorkflowsSecurityPermission>
            <WorkflowsEditorBase {...props} />
        </HasWorkflowsSecurityPermission>
    );
};
