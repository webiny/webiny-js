import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/manage_search.svg";
import { AL_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="audit-logs"
                title="Audit Logs"
                description="Manage Audit Logs permissions."
                icon={<PermissionsIcon />}
                schema={AL_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
