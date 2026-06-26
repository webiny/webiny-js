import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/flowchart.svg";
import { WORKFLOWS_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="workflows"
                title="Workflows"
                description="Manage Workflows permissions."
                icon={<PermissionsIcon />}
                schema={WORKFLOWS_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
