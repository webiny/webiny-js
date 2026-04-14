import { useCallback, useContext, useMemo } from "react";
import { useIdentity } from "@webiny/app-admin";
import { makeDecoratable } from "@webiny/react-composition";
import { ModelContext } from "@webiny/app-headless-cms-common/ModelProvider/ModelContext.js";
import type { CmsGroup, CmsIdentity, CmsModel, CmsSecurityPermission } from "~/types.js";

export interface CreatableItem {
    createdBy?: Pick<CmsIdentity, "id">;
}

interface CanReadEntriesCallableParams {
    contentModelGroup: Pick<CmsGroup, "id">;
    contentModel: Pick<CmsModel, "modelId">;
}

function isModelAllowed(modelPermissions: CmsSecurityPermission[], modelId: string): boolean {
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

function isGroupAllowed(groupPermissions: CmsSecurityPermission[], groupId: string): boolean {
    // No group permissions in this group means all groups are allowed.
    if (!groupPermissions.length) {
        return true;
    }

    for (const permission of groupPermissions) {
        // If no groups array, this permission grants access to all groups.
        if (!Array.isArray(permission.groups)) {
            return true;
        }

        if (permission.groups.includes(groupId)) {
            return true;
        }
    }

    return false;
}

interface HasAccessParams {
    permissions: CmsSecurityPermission[];
    modelPermissions: CmsSecurityPermission[];
    modelId: string;
    check: (permission: CmsSecurityPermission) => boolean;
}

/**
 * Check if any _src group grants access for the given model.
 */
function hasAccessForModel({ permissions, modelPermissions, modelId, check }: HasAccessParams) {
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

export const usePermission = makeDecoratable(() => {
    const { identity } = useIdentity();
    const model = useContext(ModelContext);
    const modelId = model?.modelId;

    const hasFullAccess = useMemo(() => !!identity.getPermission("cms.*"), [identity]);

    const modelPermissions = useMemo(
        () => identity.getPermissions<CmsSecurityPermission>("cms.contentModel") ?? [],
        [identity]
    );

    /**
     * Check permissions with _src-based model scoping when a model context is available.
     * When no model context exists, falls back to checking permissions without model correlation.
     */
    const checkPermission = useCallback(
        (permissionName: string, check: (permission: CmsSecurityPermission) => boolean) => {
            if (hasFullAccess) {
                return true;
            }

            const permissions = identity.getPermissions<CmsSecurityPermission>(permissionName);
            if (!permissions.length) {
                return false;
            }

            if (modelId) {
                return hasAccessForModel({
                    permissions,
                    modelPermissions,
                    modelId,
                    check
                });
            }

            return permissions.some(check);
        },
        [identity, hasFullAccess, modelId, modelPermissions]
    );

    const canRead = useCallback(
        (permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                if (typeof permission.rwd !== "string") {
                    return true;
                }
                return permission.rwd.includes("r");
            });
        },
        [checkPermission]
    );

    const canReadEntries = useCallback(
        ({ contentModelGroup, contentModel }: CanReadEntriesCallableParams): boolean => {
            if (hasFullAccess) {
                return true;
            }

            const entryPermissions =
                identity.getPermissions<CmsSecurityPermission>("cms.contentEntry") ?? [];
            if (!entryPermissions.length) {
                return false;
            }

            const groupPermissions =
                identity.getPermissions<CmsSecurityPermission>("cms.contentModelGroup") ?? [];

            // Group all permissions by _src. Permissions without _src go into an "ungrouped" bucket.
            const srcKeys = new Set<string | undefined>();
            for (const p of [...entryPermissions, ...modelPermissions, ...groupPermissions]) {
                srcKeys.add(p._src);
            }

            for (const src of srcKeys) {
                const srcEntryPerms = entryPermissions.filter(p => p._src === src);
                const srcModelPerms = modelPermissions.filter(p => p._src === src);
                const srcGroupPerms = groupPermissions.filter(p => p._src === src);

                if (!srcEntryPerms.length) {
                    continue;
                }

                const hasReadAccess = srcEntryPerms.some(p => {
                    if (typeof p.rwd !== "string") {
                        return true;
                    }
                    return p.rwd.includes("r");
                });

                if (!hasReadAccess) {
                    continue;
                }

                const modelAllowed = isModelAllowed(srcModelPerms, contentModel.modelId);
                if (!modelAllowed) {
                    continue;
                }

                const groupAllowed = isGroupAllowed(srcGroupPerms, contentModelGroup.id);
                if (!groupAllowed) {
                    continue;
                }

                return true;
            }

            return false;
        },
        [identity, hasFullAccess, modelPermissions]
    );

    const canEdit = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                if (permission.own) {
                    if (!item.createdBy) {
                        return true;
                    }

                    if (item?.createdBy?.id === identity.id) {
                        return true;
                    }
                }

                if (typeof permission.rwd === "string") {
                    if (permission.rwd.includes("w")) {
                        return true;
                    }
                }

                return false;
            });
        },
        [identity, checkPermission]
    );

    const canCreate = useCallback(
        (permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                if (typeof permission.rwd !== "string") {
                    return true;
                }
                return permission.rwd.includes("w");
            });
        },
        [checkPermission]
    );

    const canDelete = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                if (permission.own) {
                    return item?.createdBy?.id === identity.id;
                }

                if (typeof permission.rwd === "string") {
                    return permission.rwd.includes("d");
                }

                return false;
            });
        },
        [identity, checkPermission]
    );

    const canDeleteEntries = useCallback(
        (permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                return !!permission.rwd?.includes("d");
            });
        },
        [checkPermission]
    );

    const canPublish = useCallback(
        (permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                return !!permission.pw?.includes("p");
            });
        },
        [checkPermission]
    );

    const canUnpublish = useCallback(
        (permissionName: string): boolean => {
            return checkPermission(permissionName, permission => {
                return !!permission.pw?.includes("u");
            });
        },
        [checkPermission]
    );

    const canReadContentModels = canRead("cms.contentModel");
    const canReadContentModelGroups = canRead("cms.contentModelGroup");
    const canCreateContentModels = canCreate("cms.contentModel");
    const canCreateContentModelGroups = canCreate("cms.contentModelGroup");
    const canAccessManageEndpoint = useMemo(() => {
        return identity.getPermission("cms.endpoint.manage") !== undefined;
    }, [identity]);

    return {
        canReadEntries,
        canEdit,
        canCreate,
        canDelete,
        canDeleteEntries,
        canPublish,
        canUnpublish,
        canReadContentModels,
        canReadContentModelGroups,
        canCreateContentModels,
        canCreateContentModelGroups,
        canAccessManageEndpoint
    };
});
