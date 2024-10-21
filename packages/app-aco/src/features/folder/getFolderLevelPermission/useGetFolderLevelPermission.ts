import { useCallback, useContext } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersContext } from "~/contexts/folders";
import { GetFolderLevelPermission } from "./GetFolderLevelPermission";
import { FolderPermissionName } from "./FolderPermissionName";

export const useGetFolderLevelPermission = (permissionName: FolderPermissionName) => {
    const { canUseFolderLevelPermissions } = useWcp();

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useGetCanManageContent must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const getFolderLevelPermission = useCallback(
        (id: string) => {
            const instance = GetFolderLevelPermission.instance(
                type,
                permissionName,
                canUseFolderLevelPermissions()
            );
            return instance.execute(id);
        },
        [type, canUseFolderLevelPermissions]
    );

    return {
        getFolderLevelPermission
    };
};
