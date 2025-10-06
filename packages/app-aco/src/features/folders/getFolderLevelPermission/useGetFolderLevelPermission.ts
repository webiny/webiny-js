import { useCallback } from "react";
import { useWcp } from "@webiny/app-admin";
import { GetFolderLevelPermission } from "./GetFolderLevelPermission.js";
import type { FolderPermissionName } from "./FolderPermissionName.js";
import { useFoldersType } from "~/hooks/index.js";

export const useGetFolderLevelPermission = (permissionName: FolderPermissionName) => {
    const type = useFoldersType();
    const wcp = useWcp();

    const getFolderLevelPermission = useCallback(
        (id: string) => {
            const instance = GetFolderLevelPermission.getInstance(
                type,
                permissionName,
                wcp.canUseFolderLevelPermissions()
            );
            return instance.execute({ id });
        },
        [type, wcp]
    );

    return {
        getFolderLevelPermission
    };
};
