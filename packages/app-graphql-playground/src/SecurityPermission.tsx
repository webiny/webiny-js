import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
import { DEV_TOOLS_PERMISSIONS_SCHEMA } from "./PermissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="dev-tools"
                title="Dev Tools"
                description="Manage Dev Tools access."
                icon={<DevToolsIcon />}
                schema={DEV_TOOLS_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
