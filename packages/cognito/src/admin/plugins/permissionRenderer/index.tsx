import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/security.svg";
import { AdminUsersPermissions } from "./AdminUsersPermissions.js";
import { PermissionRendererPlugin } from "@webiny/app-admin/plugins/PermissionRendererPlugin.js";

export default new PermissionRendererPlugin({
    render(props) {
        return (
            <Accordion.Item
                icon={
                    <Accordion.Item.Icon
                        icon={<PermissionsIcon />}
                        label={"Admin Users Permissions"}
                    />
                }
                title={`Admin Users`}
                description={`Manage Admin Users access permissions.`}
                data-testid={"permission.adminUsers"}
            >
                <AdminUsersPermissions {...props} />
            </Accordion.Item>
        );
    }
});
