import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/business.svg";
import { TM_PERMISSIONS_SCHEMA } from "./domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="tenant-manager"
                title="Tenant Manager"
                description="Manage Tenant Manager permissions."
                icon={<PermissionsIcon />}
                schema={TM_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
