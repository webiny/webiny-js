import { PermissionTransformer } from "@webiny/api-core/features/security/authorization/AuthorizationContext/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class AddCmsPermissions implements PermissionTransformer.Interface {
    execute(permission: PermissionTransformer.Permission) {
        if (permission.name !== "tm.*") {
            return permission;
        }

        return [
            permission,
            {
                name: "cms.endpoint.manage",
                _src: "tenant-manager"
            },
            {
                name: "cms.contentModel",
                own: false,
                rwd: "r",
                pw: "",
                models: [TENANT_MODEL_ID],
                _src: "tenant-manager"
            },
            {
                name: "cms.contentModelGroup",
                own: false,
                rwd: "r",
                pw: "",
                groups: ["hidden"],
                _src: "tenant-manager"
            },
            {
                name: "cms.contentEntry",
                own: false,
                rwd: "rwd",
                pw: "",
                _src: "tenant-manager"
            }
        ];
    }
}

export default PermissionTransformer.createImplementation({
    implementation: AddCmsPermissions,
    dependencies: []
});
