import React from "react";
import { useSecurity } from "@webiny/app-security";
import { WORKFLOWS_EDITOR_PERMISSION } from "./constants.js";
import type { IWorkflowsEditorSecurityPermission } from "~/types.js";

interface IHasWorkflowsSecurityPermissionProps {
    children: React.ReactElement | React.ReactElement[];
}

export const HasWorkflowsSecurityPermission = (props: IHasWorkflowsSecurityPermissionProps) => {
    const { getPermission } = useSecurity();
    const permission = getPermission<IWorkflowsEditorSecurityPermission>(WORKFLOWS_EDITOR_PERMISSION);
    if (!permission) {
        return null;
    }
    return props.children;
};
