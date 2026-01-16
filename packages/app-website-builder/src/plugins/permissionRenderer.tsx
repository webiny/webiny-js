import React from "react";
import { Accordion } from "@webiny/admin-ui";
import type { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types.js";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/table_chart.svg";
import { WebsiteBuilderPermissions } from "./WebsiteBuilderPermissions.js";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-website-builder/admin/plugins/permissionRenderer");

export const permissionRenderer: AdminAppPermissionRendererPlugin = {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-website-builder",
    render(props) {
        return (
            <Accordion.Item
                icon={
                    <Accordion.Item.Icon
                        icon={<PermissionsIcon />}
                        label={"Website Builder Permissions"}
                    />
                }
                title={t`Website Builder`}
                description={t`Manage Website Builder app access permissions.`}
                data-testid={"permission.wb"}
            >
                <WebsiteBuilderPermissions {...props} />
            </Accordion.Item>
        );
    }
}
