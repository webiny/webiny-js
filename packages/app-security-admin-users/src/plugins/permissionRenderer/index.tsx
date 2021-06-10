import React from "react";
import { i18n } from "@webiny/app/i18n";
import { AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as SecurityIcon } from "@webiny/app-admin/assets/icons/baseline-security-24px.svg";
import { SecurityPermissions } from "./SecurityPermissions";
import { PermissionRendererPlugin } from "@webiny/app-admin/plugins/PermissionRendererPlugin";

const t = i18n.ns("app-security-admin-users/plugins/permissionRenderer");

export default new PermissionRendererPlugin({
    render(props) {
        return (
            <AccordionItem
                icon={<SecurityIcon />}
                title={t`Security`}
                description={t`Manage Security app access permissions.`}
            >
                <SecurityPermissions {...props} />
            </AccordionItem>
        );
    }
});
