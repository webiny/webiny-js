import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as FormBuilderIcon } from "@webiny/app-form-builder/admin/icons/round-ballot-24px.svg";
import { FormBuilderPermissions } from "./FormBuilderPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-form-builder/admin/plugins/permissionRenderer");

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-form-builder",
    render(props) {
        return (
            <AccordionItem
                icon={<FormBuilderIcon />}
                title={t`Form Builder`}
                description={t`Manage File manager app access permissions.`}
            >
                <FormBuilderPermissions {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
