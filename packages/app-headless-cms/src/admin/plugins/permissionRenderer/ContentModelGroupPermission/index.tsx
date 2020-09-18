import React from "react";
import { ContentGroupPermission } from "./components/ContentModelGroupPermission";
import { PERMISSION_CMS_CONTENT_MODEL_GROUP } from "./utils";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsContentModelGroupPermissionPlugin: PermissionRendererCmsManage = {
    type: "permission-renderer-cms-manage",
    name: "permission-renderer-cms-manage-contentModelGroup",
    key: PERMISSION_CMS_CONTENT_MODEL_GROUP,
    label: t`Content groups`,
    render({ value, setValue }) {
        return <ContentGroupPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsContentModelGroupPermissionPlugin;
