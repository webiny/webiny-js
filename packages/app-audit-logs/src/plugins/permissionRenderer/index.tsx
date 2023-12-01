import React, { useEffect } from "react";
import { ReactComponent as Icon } from "@material-symbols/svg-400/outlined/quick_reference_all.svg";

import { i18n } from "@webiny/app/i18n";
import { plugins } from "@webiny/plugins";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";

import { AuditLogsPermissions as AuditLogsPermissionsComponent } from "./AuditLogsPermissions";

const t = i18n.ns("app-audit-logs/plugins/permissionRenderer");

const createPermissions = (): AdminAppPermissionRendererPlugin => {
    return {
        type: "admin-app-permissions-renderer",
        name: "admin-app-permissions-renderer-audit-logs",
        render(props) {
            return (
                <AccordionItem
                    icon={<Icon />}
                    title={t`Audit Logs`}
                    description={t`Manage Audit Logs app access permissions.`}
                    data-testid={"permission.al"}
                >
                    <AuditLogsPermissionsComponent {...props} />
                </AccordionItem>
            );
        }
    };
};

export const AuditLogsPermissions: React.FC = () => {
    useEffect(() => {
        plugins.register(createPermissions());
    }, []);
    return null;
};
