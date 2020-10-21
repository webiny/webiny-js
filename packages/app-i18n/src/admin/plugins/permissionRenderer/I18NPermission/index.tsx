import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as TranslateIcon } from "@webiny/app-i18n/admin/assets/icons/round-translate-24px.svg";
import { I18NPermissions } from "./I18NPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-i18n",
    render(props) {
        return (
            <AccordionItem
                icon={<TranslateIcon />}
                title={t`I18N`}
                description={t`Manage I18N app access permissions.`}
            >
                <I18NPermissions {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
