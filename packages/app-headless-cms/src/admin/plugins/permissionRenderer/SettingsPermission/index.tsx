import React from "react";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { PERMISSION_CMS_SETTING } from "./utils";
import { CmsSettingsPermission } from "./components/SettingsPermission";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsSettingsPermissionPlugin: PermissionRendererCmsManage = {
    type: "permission-renderer-cms-manage",
    name: "permission-renderer-cms-manage-settings",
    key: PERMISSION_CMS_SETTING,
    label: t`Manage headless settings`,
    render({ value, setValue }) {
        return <CmsSettingsPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsSettingsPermissionPlugin;
