import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { AdminAppPermissionRenderer } from "@webiny/app-admin/types";

import cmsContentModelPermissionPlugin from "./ContentModelPermission/index";
import cmsContentModelGroupPermissionPlugin from "./ContentModelGroupPermission";
import cmsEntryPermissionPlugin from "./ContentEntryPermission";
import cmsPermissionPlugin from "./CmsPermission";
import cmsEnvironmentPermissionPlugin from "./EnvironmentPermission";
import cmsSettingsPermissionPlugin from "./SettingsPermission";

const permissionRendererCmsManagePlugins: PermissionRendererCmsManage[] = [
    cmsContentModelPermissionPlugin,
    cmsContentModelGroupPermissionPlugin,
    cmsEntryPermissionPlugin,
    cmsEnvironmentPermissionPlugin,
    cmsSettingsPermissionPlugin
];

export default () => [
    permissionRendererCmsManagePlugins,
    cmsPermissionPlugin as AdminAppPermissionRenderer
];
