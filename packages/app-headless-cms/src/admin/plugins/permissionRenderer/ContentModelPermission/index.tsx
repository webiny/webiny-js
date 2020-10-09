import React from "react";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { ContentModelPermission } from "./components/ContentModelPermission";
import { PERMISSION_CMS_CONTENT_MODEL } from "./utils";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsContentModelPermissionPlugin: PermissionRendererCmsManage = {
    type: "permission-renderer-cms-manage",
    name: "permission-renderer-cms-manage-contentModel",
    key: PERMISSION_CMS_CONTENT_MODEL,
    label: t`Content models`,
    render({ value, setValue }) {
        return <ContentModelPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsContentModelPermissionPlugin;
