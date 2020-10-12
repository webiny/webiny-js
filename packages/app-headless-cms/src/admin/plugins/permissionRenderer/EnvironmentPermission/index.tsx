import React from "react";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { PERMISSION_CMS_ENVIRONMENT } from "./utils";
import { CmsEnvironmentPermission } from "./components/EnvironmentPermission";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsEnvironmentPermissionPlugin: PermissionRendererCmsManage = {
    type: "permission-renderer-cms-manage",
    name: "permission-renderer-cms-manage-environments",
    key: PERMISSION_CMS_ENVIRONMENT,
    label: t`Environment access`,
    render({ value, setValue }) {
        return <CmsEnvironmentPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsEnvironmentPermissionPlugin;
