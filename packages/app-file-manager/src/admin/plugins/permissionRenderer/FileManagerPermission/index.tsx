import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as FileManagerIcon } from "@webiny/app-file-manager/admin/assets/icons/folder-open.svg";
import { FileManagerPermissions } from "./components/FileManagerPermissions";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-file-manager",
    render({ id, ...props }) {
        return (
            <AccordionItem
                key={this.name}
                icon={<FileManagerIcon />}
                title={t`File Manager`}
                description={t`Permissions for File manager app`}
            >
                {/* We use key to unmount the component */}
                <FileManagerPermissions key={id} {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
