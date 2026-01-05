import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Accordion } from "@webiny/admin-ui";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/security.svg";
import { SecurityPermissions } from "./SecurityPermissions.js";
import { PermissionRendererPlugin } from "@webiny/app-admin/plugins/PermissionRendererPlugin.js";

const t = i18n.ns("app-security-admin-users/plugins/permissionRenderer");

export const permissionRendererPlugin = new PermissionRendererPlugin({
    render(props) {
        return (
            <Accordion.Item
                icon={
                    <Accordion.Item.Icon
                        icon={<PermissionsIcon />}
                        label={"Security Permissions"}
                    />
                }
                title={t`Security`}
                description={t`Manage Security app access permissions.`}
                data-testid={"permission.security"}
            >
                <SecurityPermissions {...props} />
            </Accordion.Item>
        );
    }
});
