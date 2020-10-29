import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "./icons/how_to_vote-24px.svg";
import { ContentPermissions } from "./ContentPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-content-locales",
    render(props) {
        return (
            <AccordionItem
                icon={<Icon />}
                title={t`Content`}
                description={t`Per-locale content access permissions management.`}
            >
                <ContentPermissions {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
