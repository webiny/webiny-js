import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import { FormBuilderSecurityPermission } from "~/types";

interface CreatableItem {
    createdBy?: {
        id?: string;
    };
}

export const usePermission = () => {
    const { identity, getIdentityId, getPermission, getPermissions } = useSecurity();

    const fbFormPermissions = useMemo((): FormBuilderSecurityPermission[] => {
        return getPermissions("fb.form");
    }, [identity]);

    const hasFullAccess = useMemo(() => !!getPermission("fb.*"), [identity]);

    const hasNoAccess = useMemo(() => fbFormPermissions.length === 0, [fbFormPermissions]);

    const canWrite = useCallback(
        (item?: CreatableItem) => {
            if (hasFullAccess) {
                return true;
            }

            return fbFormPermissions.some(({ rwd, own }) => {
                if (rwd && rwd.includes("w")) {
                    return true;
                }

                const createdById = item?.createdBy?.id;

                if (createdById && own) {
                    const identityId = getIdentityId();
                    return identity && createdById === identityId;
                }

                return false;
            });
        },
        [fbFormPermissions, hasFullAccess]
    );

    const canCreate = useCallback(() => canWrite(), [canWrite]);
    const canUpdate = useCallback((item: CreatableItem) => canWrite(item), [canWrite]);

    const canDelete = useCallback(
        (item: CreatableItem) => {
            // Bail out early if no access or has full access.
            if (hasNoAccess) {
                return false;
            }

            return (
                hasFullAccess ||
                fbFormPermissions.some(({ rwd, own }) => {
                    if (own) {
                        const identityId = getIdentityId();
                        const createdById = item.createdBy?.id;
                        return identityId && identityId === createdById;
                    }

                    if (rwd && rwd.includes("d")) {
                        return true;
                    }

                    return false;
                })
            );
        },
        [fbFormPermissions]
    );

    const canPublish = useCallback(() => {
        if (hasFullAccess) {
            return true;
        }

        return fbFormPermissions.some(({ pw }) => {
            if (typeof pw === "string" && pw.includes("p")) {
                return true;
            }

            return false;
        });
    }, [fbFormPermissions, hasFullAccess]);

    const canUnpublish = useCallback(() => {
        if (hasFullAccess) {
            return true;
        }

        return fbFormPermissions.some(({ pw }) => {
            if (typeof pw === "string" && pw.includes("u")) {
                return true;
            }

            return false;
        });
    }, [fbFormPermissions, hasFullAccess]);

    return {
        canCreate,
        canUpdate,
        canDelete,
        canPublish,
        canUnpublish
    };
};
