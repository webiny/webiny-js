import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import { PageBuilderSecurityPermission } from "~/types";

export interface UsePermission {
    canCreate: () => boolean;
    canUpdate: (createdById?: string) => boolean;
    canWrite: (createdById?: string | null) => boolean;
    canDelete: (createdById?: string | null) => boolean;
    canPublish: () => boolean;
    canUnpublish: () => boolean;
    hasPermissions: () => boolean;
}

const PB_FULL_ACCESS_PERMISSION_NAME = "pb.*";

export const createUsePermissions = (permissionName: string) => (): UsePermission => {
    const { identity, getPermission, getPermissions } = useSecurity();

    const permissionsByName = useMemo((): PageBuilderSecurityPermission[] => {
        return getPermissions(permissionName);
    }, [identity]);

    const hasFullAccess = useMemo(
        (): boolean => !!getPermission(PB_FULL_ACCESS_PERMISSION_NAME),
        [identity]
    );

    const hasPermissions = useCallback((): boolean => {
        return hasFullAccess || permissionsByName.length > 0;
    }, [hasFullAccess, permissionsByName]);

    const canWrite = useCallback<UsePermission["canWrite"]>(
        createdById => {
            if (hasFullAccess) {
                return true;
            }

            return permissionsByName.some(({ rwd, own }) => {
                if (rwd && rwd.includes("w")) {
                    return true;
                }

                console.log('woot')
                if (own && createdById) {
                    return identity && createdById === identity.login;
                }

                return false;
            });
        },
        [permissionsByName, hasFullAccess]
    );

    const canCreate = useCallback<UsePermission["canCreate"]>(() => canWrite(), [canWrite]);
    const canUpdate = useCallback<UsePermission["canUpdate"]>(
        createdById => canWrite(createdById),
        [canWrite]
    );

    const canDelete = useCallback<UsePermission["canDelete"]>(
        createdById => {
            if (hasFullAccess) {
                return true;
            }

            return permissionsByName.some(({ rwd, own }) => {
                if (rwd && rwd.includes("d")) {
                    return true;
                }

                if (own && createdById) {
                    return identity && createdById === identity.login;
                }

                return false;
            });
        },
        [permissionsByName, hasFullAccess]
    );

    const canPublish = useCallback<UsePermission["canPublish"]>(() => {
        if (hasFullAccess) {
            return true;
        }

        return permissionsByName.some(({ pw }) => {
            if (typeof pw === "string" && pw.includes("p")) {
                return true;
            }

            return false;
        });
    }, [permissionsByName, hasFullAccess]);

    const canUnpublish = useCallback<UsePermission["canUnpublish"]>(() => {
        if (hasFullAccess) {
            return true;
        }

        return permissionsByName.some(({ pw }) => {
            if (typeof pw === "string" && pw.includes("u")) {
                return true;
            }

            return false;
        });
    }, [permissionsByName, hasFullAccess]);

    return {
        canWrite,
        canCreate,
        canUpdate,
        canDelete,
        canPublish,
        canUnpublish,
        hasPermissions
    };
};
