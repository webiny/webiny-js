import React from "react";
import { FilesPermission } from "./components/FilesPermission";
import { PERMISSION_FILES_FILE } from "./utils";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererFileManager } from "@webiny/app-file-manager/types";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

const cmsContentModelPermissionPlugin: PermissionRendererFileManager = {
    type: "permission-renderer-file-manager",
    name: "permission-renderer-file-manager-contentModel",
    key: PERMISSION_FILES_FILE,
    label: t`Files`,
    render({ value, setValue }) {
        return <FilesPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsContentModelPermissionPlugin;
