import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/folder_open.svg";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="file-manager"
                title="File Manager"
                description="Manage File Manager permissions."
                icon={<PermissionsIcon />}
                schema={{
                    prefix: "fm",
                    fullAccess: true,
                    entities: [
                        {
                            id: "file",
                            title: "File",
                            scopes: ["full", "own"],
                            permission: "fm.file",
                            actions: [
                                {
                                    name: "rwd"
                                }
                            ]
                        },
                        {
                            id: "settings",
                            title: "Settings",
                            scopes: ["full"],
                            permission: "fm.settings"
                        }
                    ]
                }}
            />
        </AdminConfig>
    );
};
