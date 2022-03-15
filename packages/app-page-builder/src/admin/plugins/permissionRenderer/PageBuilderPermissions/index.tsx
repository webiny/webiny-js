import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "../../../assets/table_chart-24px.svg";
import { PageBuilderPermissions } from "./PageBuilderPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

const plugin: AdminAppPermissionRendererPlugin = {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-page-builder",
    render(props) {
        return (
            <AccordionItem
                icon={<Icon />}
                title={t`Page Builder`}
                description={t`Manage Page Builder app access permissions.`}
                data-testid={"permission.pb"}
            >
                <PageBuilderPermissions {...props} />
            </AccordionItem>
        );
    }
};
export default plugin;
