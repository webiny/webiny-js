import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import type { FolderPermissionName } from "~/features/index.js";
import { GetFolderLevelPermissionFeature } from "./feature.js";

export const useGetFolderLevelPermission = (permissionName: FolderPermissionName) => {
    const { useCase } = useFeature(GetFolderLevelPermissionFeature);

    const getFolderLevelPermission = useCallback(
        (id: string) => {
            return useCase.execute(id, permissionName);
        },
        [useCase]
    );

    return {
        getFolderLevelPermission
    };
};
