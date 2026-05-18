import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/webhook.svg";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="webhooks"
                title="Webhooks"
                description="Manage Webhooks permissions."
                icon={<PermissionsIcon />}
                schema={WEBHOOK_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
