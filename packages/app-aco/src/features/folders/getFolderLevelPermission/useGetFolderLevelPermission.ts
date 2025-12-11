import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { GetFolderLevelPermissionFeature } from "./feature.js";
import { FolderPermissionName } from "../abstractions.js";

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
