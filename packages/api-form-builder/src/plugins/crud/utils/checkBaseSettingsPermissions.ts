import { NotAuthorizedError } from "@webiny/api-security";
import { FbFormSettingsPermission, FormBuilderContext } from "~/types";

export const checkBaseSettingsPermissions = async (
    context: FormBuilderContext
): Promise<FbFormSettingsPermission> => {
    const permission = await context.security.getPermission<FbFormSettingsPermission>(
        "fb.settings"
    );
    if (!permission) {
        throw new NotAuthorizedError();
    }

    return permission;
};
