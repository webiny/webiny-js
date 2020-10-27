import React from "react";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererFileManager } from "@webiny/app-file-manager/types";
import { SettingsPermission } from "./components/SettingsPermission";
import { PERMISSION_FILES_SETTINGS } from "./utils";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

const cmsContentModelPermissionPlugin: PermissionRendererFileManager = {
    type: "permission-renderer-file-manager",
    name: "permission-renderer-file-manager-settings",
    key: PERMISSION_FILES_SETTINGS,
    label: t`Settings`,
    render({ value, setValue }) {
        return <SettingsPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsContentModelPermissionPlugin;
