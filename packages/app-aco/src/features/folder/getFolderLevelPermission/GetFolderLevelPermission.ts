import { IGetFolderLevelPermissionUseCase } from "./IGetFolderLevelPermissionUseCase";
import { GetFolderLevelPermissionRepository } from "./GetFolderLevelPermissionRepository";
import { GetFolderLevelPermissionWithFlpUseCase } from "./GetFolderLevelPermissionWithFlpUseCase";
import { GetFolderLevelPermissionUseCase } from "./GetFolderLevelPermissionUseCase";
import { FolderPermissionName } from "./FolderPermissionName";
import { folderCacheFactory } from "../cache";

export class GetFolderLevelPermission {
    public static instance(
        type: string,
        permissionName: FolderPermissionName,
        canUseFlp: boolean
    ): IGetFolderLevelPermissionUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const repository = new GetFolderLevelPermissionRepository(foldersCache, permissionName);

        if (canUseFlp) {
            return new GetFolderLevelPermissionWithFlpUseCase(repository);
        }

        return new GetFolderLevelPermissionUseCase();
    }
}
