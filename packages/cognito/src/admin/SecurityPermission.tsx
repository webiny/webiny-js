import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/group.svg";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="admin-users"
                title="Admin Users"
                description="Manage Admin Users permissions."
                icon={<PermissionsIcon />}
                schema={{
                    prefix: "adminUsers",
                    fullAccess: { name: "adminUsers.*" },
                    entities: [
                        {
                            id: "user",
                            title: "Users",
                            permission: "adminUsers.user",
                            scopes: ["full"]
                        }
                    ]
                }}
            />
        </AdminConfig>
    );
};
