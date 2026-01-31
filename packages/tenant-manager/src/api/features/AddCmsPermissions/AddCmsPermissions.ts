import { PermissionTransformer } from "@webiny/api-core/features/security/authorization/AuthorizationContext/abstractions.js";

class AddCmsPermissions implements PermissionTransformer.Interface {
    execute(permission: PermissionTransformer.Permission) {
        if (permission.name !== "tm.*") {
            return permission;
        }

        return [
            permission,
            {
                name: "cms.endpoint.manage"
            },
            {
                name: "cms.contentModel",
                own: false,
                rwd: "r",
                pw: "",
                models: ["tenant"]
            },
            {
                name: "cms.contentModelGroup",
                own: false,
                rwd: "r",
                pw: "",
                groups: ["hidden"]
            },
            {
                name: "cms.contentEntry",
                own: false,
                rwd: "rwd",
                pw: ""
            }
        ];
    }
}

export default PermissionTransformer.createImplementation({
    implementation: AddCmsPermissions,
    dependencies: []
});
