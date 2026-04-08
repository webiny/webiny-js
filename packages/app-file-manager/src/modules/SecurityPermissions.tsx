import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/folder_open.svg";
import { FM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="file-manager"
                title="File Manager"
                description="Manage File Manager permissions."
                icon={<PermissionsIcon />}
                schema={FM_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
