import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "@material-symbols/svg-400/outlined/quick_reference_all.svg";
import { AuditLogsPermissions } from "./AuditLogsPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-audit-logs/plugins/permissionRenderer");

const plugin: AdminAppPermissionRendererPlugin = {
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
                <AuditLogsPermissions {...props} />
            </AccordionItem>
        );
    }
};

export default plugin;
