import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/group.svg";
import { ADMIN_USERS_PERMISSIONS_SCHEMA } from "~/features/adminUsers/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="admin-users"
                title="Admin Users"
                description="Manage Admin Users permissions."
                icon={<PermissionsIcon />}
                schema={ADMIN_USERS_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
