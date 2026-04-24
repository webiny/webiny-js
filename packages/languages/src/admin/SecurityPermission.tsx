import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/language.svg";
import { LANGUAGES_PERMISSIONS_SCHEMA } from "~/admin/PermissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="languages"
                title="Languages"
                description="Manage language permissions."
                icon={<PermissionsIcon />}
                schema={LANGUAGES_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
