import { PermissionTransformer } from "@webiny/api-core/features/security/authorization/AuthorizationContext/abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";

class AddCmsPermissions implements PermissionTransformer.Interface {
    execute(permission: PermissionTransformer.Permission) {
        if (!permission.name.startsWith("languages.")) {
            return permission;
        }

        const isReadOnly = permission.name === "languages.*" && permission.rwd === "r";

        return [
            permission,
            {
                name: "cms.endpoint.manage",
                _src: "languages"
            },
            {
                name: "cms.contentModel",
                own: false,
                rwd: "r",
                pw: "",
                models: [LANGUAGE_MODEL_ID],
                _src: "languages"
            },
            {
                name: "cms.contentModelGroup",
                own: false,
                rwd: "r",
                pw: "",
                groups: ["hidden"],
                _src: "languages"
            },
            {
                name: "cms.contentEntry",
                own: false,
                rwd: isReadOnly ? "r" : "rwd",
                pw: "",
                _src: "languages"
            }
        ];
    }
}

export default PermissionTransformer.createImplementation({
    implementation: AddCmsPermissions,
    dependencies: []
});
