import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/flowchart.svg";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="workflows"
                title="Workflows"
                description="Manage Workflows permissions."
                icon={<PermissionsIcon />}
                schema={{
                    prefix: "workflows",
                    fullAccess: { editor: true }
                }}
            />
        </AdminConfig>
    );
};
