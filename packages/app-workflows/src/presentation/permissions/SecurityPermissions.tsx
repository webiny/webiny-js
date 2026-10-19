import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as WorkflowsIcon } from "@webiny/icons/account_tree.svg";
import { WORKFLOWS_ACCESS_COPY } from "~/domain/permissions/workflowsAccessCopy.js";
import { WorkflowsRolePermissions } from "./WorkflowsRolePermissions.js";

const { Security } = AdminConfig;

// The Workflows group of the role and API key forms: a custom element, not the schema renderer (R333).
export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="workflows"
                title={WORKFLOWS_ACCESS_COPY.title}
                description={WORKFLOWS_ACCESS_COPY.description}
                icon={<WorkflowsIcon />}
                element={<WorkflowsRolePermissions />}
            />
        </AdminConfig>
    );
};
