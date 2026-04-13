import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/language.svg";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="languages"
                title="Languages"
                description="Manage language permissions."
                icon={<PermissionsIcon />}
                schema={{
                    prefix: "languages",
                    fullAccess: true
                }}
            />
        </AdminConfig>
    );
};
