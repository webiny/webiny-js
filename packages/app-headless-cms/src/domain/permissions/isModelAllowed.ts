import type { CmsSecurityPermission } from "~/types.js";

export function isModelAllowed(
    modelPermissions: CmsSecurityPermission[],
    modelId: string
): boolean {
    // No model permissions in this group means all models are allowed.
    if (!modelPermissions.length) {
        return true;
    }

    for (const permission of modelPermissions) {
        // If no models array, this permission grants access to all models.
        if (!Array.isArray(permission.models)) {
            return true;
        }

        if (permission.models.includes(modelId)) {
            return true;
        }
    }

    return false;
}
