import securityPermissionRendererPlugin from "./SecurityPermissions";
import securityGroupPermissionRendererPlugin from "./SecurityGroupPermission";
import securityUserPermissionRendererPlugin from "./SecurityUserPermission";

export default () => [
    securityGroupPermissionRendererPlugin(),
    securityUserPermissionRendererPlugin(),
    securityPermissionRendererPlugin()
];
