import React from "react";
import { Accordion } from "@webiny/admin-ui";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/devices_other.svg";
import { WorkflowsPermissionsForm } from "~/Components/WorkflowsPermissions/WorkflowsPermissionsForm.js";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";

interface IWorkflowsPermissionsProps {
    value: IWorkflowsSecurityPermission[];
    onChange: (value: IWorkflowsSecurityPermission[]) => void;
}

export const WorkflowsPermissions = (props: IWorkflowsPermissionsProps) => {
    const canUseWorkflows = useCanUseWorkflows();

    if (!canUseWorkflows) {
        return null;
    }
    return (
        <Accordion.Item
            icon={
                <Accordion.Item.Icon icon={<PermissionsIcon />} label={"Workflows Permissions"} />
            }
            title={"Workflows"}
            description={"Manage Workflows app access permissions."}
            data-testid={"permission.workflows"}
        >
            <WorkflowsPermissionsForm {...props} />
        </Accordion.Item>
    );
};
