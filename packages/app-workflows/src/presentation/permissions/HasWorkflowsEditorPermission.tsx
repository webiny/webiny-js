import React from "react";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";

export interface IHasWorkflowsSecurityPermissionProps {
    children: React.ReactElement | React.ReactElement[];
}

export const HasWorkflowsEditorPermission = (props: IHasWorkflowsSecurityPermissionProps) => {
    const hasPermission = useWorkflowsPermission();

    if (!hasPermission.editor) {
        return null;
    }
    return props.children;
};
