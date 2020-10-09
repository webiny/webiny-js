import React from "react";
import { ContentEntryPermission } from "./components/ContentEntryPermission";
import { PERMISSION_CMS_CONTENT_ENTRY } from "./utils";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsEntryPermissionPlugin: PermissionRendererCmsManage = {
    type: "permission-renderer-cms-manage",
    name: "permission-renderer-cms-manage-record",
    key: PERMISSION_CMS_CONTENT_ENTRY,
    label: t`Records`,
    render({ value, setValue }) {
        return <ContentEntryPermission key={this.name} value={value} setValue={setValue} />;
    }
};

export default cmsEntryPermissionPlugin;
