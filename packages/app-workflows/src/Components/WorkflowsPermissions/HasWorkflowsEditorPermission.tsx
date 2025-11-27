import React from "react";
import { useWorkflowsPermission } from "~/Components/WorkflowsPermissions/useWorkflowsPermission.js";

interface IHasWorkflowsSecurityPermissionProps {
    children: React.ReactElement | React.ReactElement[];
}

export const HasWorkflowsEditorPermission = (props: IHasWorkflowsSecurityPermissionProps) => {
    const hasPermission = useWorkflowsPermission();

    if (!hasPermission.editor) {
        return null;
    }
    return props.children;
};
