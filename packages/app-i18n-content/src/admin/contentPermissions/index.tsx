import React from "react";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/how_to_vote.svg";
import { ContentPermissions } from "./ContentPermissions";
import { i18n } from "@webiny/app/i18n";
import { Accordion } from "@webiny/admin-ui";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-content-locales",
    system: true,
    render(props) {
        return (
            <Accordion.Item
                defaultOpen={true}
                icon={<Accordion.Item.Icon label={"Content"} icon={<PermissionsIcon />} />}
                title={t`Content`}
                description={t`Per-locale content access permissions management.`}
                data-testid={"permission.content"}
            >
                <ContentPermissions {...props} />
            </Accordion.Item>
        );
    }
} as AdminAppPermissionRendererPlugin;
