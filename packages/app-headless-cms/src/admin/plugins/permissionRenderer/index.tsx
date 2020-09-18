import cmsContentModelPermissionPlugin from "./ContentModelPermission/index";
import cmsContentModelGroupPermissionPlugin from "./ContentModelGroupPermission";
import cmsEntryPermissionPlugin from "./ContentEntryPermission";
import cmsPermissionPlugin from "./CmsPermission";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { AdminAppPermissionRenderer } from "@webiny/app-admin/types";

const permissionRendererCmsManagePlugins: PermissionRendererCmsManage[] = [
    cmsContentModelPermissionPlugin,
    cmsContentModelGroupPermissionPlugin,
    cmsEntryPermissionPlugin
];

export default () => [
    permissionRendererCmsManagePlugins,
    cmsPermissionPlugin as AdminAppPermissionRenderer
];
