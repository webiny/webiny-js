import React, { useEffect } from "react";
import { Accordion } from "@webiny/admin-ui";
import { plugins } from "@webiny/plugins";
import type { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types.js";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/business.svg";
import { TenantManagerPermissions } from "./TenantManagerPermissions.js";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-website-builder/admin/plugins/permissionRenderer");

export const LegacyPermissionRenderer = () => {
    useEffect(() => {
        plugins.register({
            type: "admin-app-permissions-renderer",
            name: "admin-app-permissions-renderer-tenant-manager",
            render(props) {
                return (
                    <Accordion.Item
                        icon={
                            <Accordion.Item.Icon
                                icon={<PermissionsIcon />}
                                label={"Tenant Manager Permissions"}
                            />
                        }
                        title={t`Tenant Manager`}
                        description={t`Manage Tenant Manager app access permissions.`}
                        data-testid={"permission.tm"}
                    >
                        <TenantManagerPermissions {...props} />
                    </Accordion.Item>
                );
            }
        } as AdminAppPermissionRendererPlugin);
    }, []);
    return null;
};
