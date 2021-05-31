import React from "react";
import { i18n } from "@webiny/app/i18n";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as SecurityIcon } from "@webiny/app-admin/assets/icons/baseline-security-24px.svg";
import { SecurityPermissions } from "./SecurityPermissions";

const t = i18n.ns("app-security-tenancy/plugins/permissionRenderer");

export default (): AdminAppPermissionRendererPlugin => {
    return {
        type: "admin-app-permissions-renderer",
        name: "admin-app-permissions-renderer-security",
        render(props) {
            return (
                <AccordionItem
                    icon={<SecurityIcon />}
                    title={t`Security`}
                    description={t`Manage Security app access permissions.`}
                    data-testid={"permission.security"}
                >
                    <SecurityPermissions {...props} />
                </AccordionItem>
            );
        }
    };
};
