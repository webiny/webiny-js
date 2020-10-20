import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as SecurityIcon } from "@webiny/app-admin/assets/icons/baseline-security-24px.svg";
import SecurityPermissions from "./components/SecurityPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-security-user-management/plugins/permissionRenderer");

export default () =>
    ({
        type: "admin-app-permissions-renderer",
        name: "admin-app-permissions-renderer-security",
        render({ id, ...props }) {
            return (
                <AccordionItem
                    key={this.name}
                    icon={<SecurityIcon />}
                    title={t`Security`}
                    description={t`Permissions for Security app`}
                >
                    {/* We use key to unmount the component */}
                    <SecurityPermissions key={id} {...props} />
                </AccordionItem>
            );
        }
    } as AdminAppPermissionRendererPlugin);
