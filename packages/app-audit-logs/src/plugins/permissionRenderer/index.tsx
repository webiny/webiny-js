import React, { useEffect } from "react";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/manage_search.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { plugins } from "@webiny/plugins";
import { Accordion } from "@webiny/admin-ui";
import type { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types.js";
import { AuditLogsPermissions as AuditLogsPermissionsComponent } from "./AuditLogsPermissions.js";

const t = i18n.ns("app-audit-logs/plugins/permissionRenderer");

const createPermissions = (): AdminAppPermissionRendererPlugin => {
    return {
        type: "admin-app-permissions-renderer",
        name: "admin-app-permissions-renderer-audit-logs",
        render(props) {
            return (
                <Accordion.Item
                    icon={
                        <Accordion.Item.Icon
                            icon={<PermissionsIcon />}
                            label={"Audit Logs Permissions"}
                        />
                    }
                    title={t`Audit Logs`}
                    description={t`Manage Audit Logs app access permissions.`}
                    data-testid={"permission.al"}
                >
                    <AuditLogsPermissionsComponent {...props} />
                </Accordion.Item>
            );
        }
    };
};

export const AuditLogsPermissions = () => {
    useEffect(() => {
        plugins.register(createPermissions());
    }, []);
    return null;
};
