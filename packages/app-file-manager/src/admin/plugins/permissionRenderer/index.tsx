import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as FileManagerIcon } from "../../assets/icons/folder-open.svg";
import { FileManagerPermissions } from "./FileManagerPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-file-manager",
    render(props) {
        return (
            <AccordionItem
                icon={<FileManagerIcon />}
                title={t`File Manager`}
                description={t`Manage File manager app access permissions.`}
                data-testid={"permission.fm"}
            >
                <FileManagerPermissions {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
