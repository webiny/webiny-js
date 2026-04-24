import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/group.svg";
import { COGNITO_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="admin-users"
                title="Admin Users"
                description="Manage Admin Users permissions."
                icon={<PermissionsIcon />}
                schema={COGNITO_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
