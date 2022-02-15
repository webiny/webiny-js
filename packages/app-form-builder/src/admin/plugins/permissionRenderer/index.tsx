import React from "react";
import { i18n } from "@webiny/app/i18n";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as FormBuilderIcon } from "../../icons/round-ballot-24px.svg";
import { FormBuilderPermissions } from "./FormBuilderPermissions";

const t = i18n.ns("app-form-builder/admin/plugins/permissionRenderer");

const plugin: AdminAppPermissionRendererPlugin = {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-form-builder",
    render(props) {
        return (
            <AccordionItem
                icon={<FormBuilderIcon />}
                title={t`Form Builder`}
                description={t`Manage Form Builder app access permissions.`}
                data-testid={"permission.fb"}
            >
                <FormBuilderPermissions {...props} />
            </AccordionItem>
        );
    }
};
export default () => plugin;
