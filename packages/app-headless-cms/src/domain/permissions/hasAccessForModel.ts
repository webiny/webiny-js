import type { CmsSecurityPermission } from "~/types.js";
import { isModelAllowed } from "./isModelAllowed.js";

export interface HasAccessForModelParams {
    permissions: CmsSecurityPermission[];
    modelPermissions: CmsSecurityPermission[];
    modelId: string;
    check: (permission: CmsSecurityPermission) => boolean;
}

/**
 * Check if any _src group grants access for the given model.
 */
export function hasAccessForModel({
    permissions,
    modelPermissions,
    modelId,
    check
}: HasAccessForModelParams): boolean {
    const srcKeys = new Set<string | undefined>();
    for (const p of [...permissions, ...modelPermissions]) {
        srcKeys.add(p._src);
    }

    for (const src of srcKeys) {
        const srcPerms = permissions.filter(p => p._src === src);
        const srcModelPerms = modelPermissions.filter(p => p._src === src);

        if (!srcPerms.length) {
            continue;
        }

        if (!srcPerms.some(check)) {
            continue;
        }

        const modelAllowed = isModelAllowed(srcModelPerms, modelId);
        if (!modelAllowed) {
            continue;
        }

        return true;
    }

    return false;
}
