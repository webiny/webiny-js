import { PermissionTransformer } from "@webiny/api-core/features/security/authorization/AuthorizationContext/abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";

class AddCmsPermissions implements PermissionTransformer.Interface {
    execute(permission: PermissionTransformer.Permission) {
        if (!permission.name.startsWith("languages.")) {
            return permission;
        }

        console.log("add languages permissions", permission);
        const isReadOnly = permission.name === "languages.*" && permission.rwd === "r";

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
                models: [LANGUAGE_MODEL_ID]
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
                rwd: isReadOnly ? "r" : "rwd",
                pw: ""
            }
        ];
    }
}

export default PermissionTransformer.createImplementation({
    implementation: AddCmsPermissions,
    dependencies: []
});
